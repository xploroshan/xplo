import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import {
  paymentsEnabled,
  createRazorpayOrder,
  platformFeePercent,
  RAZORPAY_KEY_ID,
} from "@/lib/razorpay"
import { fulfillOrder } from "@/lib/orders"

const body = z.object({
  ticketTypeId: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
})

// Organizer revenue view: list PAID orders + aggregates. Refunds are out of
// scope here (no refund flow yet) — this is read-only reconciliation.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  })
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
  if (event.organizerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const orders = await db.order.findMany({
    where: { eventId, status: "PAID" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      quantity: true,
      amount: true,
      platformFee: true,
      currency: true,
      createdAt: true,
      razorpayPaymentId: true,
      ticketType: { select: { name: true } },
      user: { select: { name: true } },
    },
  })

  let gross = 0
  let fees = 0
  let tickets = 0
  const rows = orders.map((o) => {
    const amount = Number(o.amount)
    const fee = Number(o.platformFee)
    gross += amount
    fees += fee
    tickets += o.quantity
    return {
      id: o.id,
      buyer: o.user.name || "Rider",
      tier: o.ticketType?.name ?? "—",
      quantity: o.quantity,
      amount,
      platformFee: fee,
      net: Math.round((amount - fee) * 100) / 100,
      currency: o.currency,
      paymentId: o.razorpayPaymentId,
      createdAt: o.createdAt,
    }
  })

  return NextResponse.json({
    orders: rows,
    summary: {
      gross: Math.round(gross * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      net: Math.round((gross - fees) * 100) / 100,
      count: rows.length,
      tickets,
      currency: orders[0]?.currency ?? "INR",
    },
  })
}

// Begin a ticket purchase: validates availability, creates an Order, and (for
// paid tiers) a Razorpay order for the checkout. Free tiers confirm instantly.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id
  const { eventId } = await params

  const { success } = await rateLimit(`order:${userId}`, 15, 60_000)
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 })
  }

  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  const { ticketTypeId, quantity } = parsed.data

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true, slug: true, title: true, organizerId: true },
  })
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })
  if (event.organizerId === userId) {
    return NextResponse.json({ error: "You're the organizer of this event" }, { status: 400 })
  }
  if (!["PUBLISHED", "OPEN", "ACTIVE"].includes(event.status)) {
    return NextResponse.json({ error: "This event isn't selling tickets" }, { status: 400 })
  }

  const tt = await db.ticketType.findFirst({
    where: { id: ticketTypeId, eventId, isActive: true },
    select: { id: true, price: true, quantity: true, sold: true, name: true },
  })
  if (!tt) return NextResponse.json({ error: "Ticket type not found" }, { status: 404 })
  if (tt.quantity != null && tt.sold + quantity > tt.quantity) {
    return NextResponse.json({ error: "Not enough tickets left" }, { status: 409 })
  }

  // Already has a ticket / is confirmed?
  const existing = await db.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { status: true },
  })
  if (existing && existing.status === "CONFIRMED") {
    return NextResponse.json({ error: "You already have a ticket for this event" }, { status: 409 })
  }

  const unit = Number(tt.price)
  const amount = Math.round(unit * quantity * 100) / 100 // INR, 2dp
  const platformFee = Math.round(amount * (platformFeePercent() / 100) * 100) / 100

  // Free tier → confirm immediately, no payment.
  if (amount <= 0) {
    const order = await db.order.create({
      data: { eventId, ticketTypeId, userId, quantity, amount: 0, platformFee: 0, status: "PENDING" },
      select: { id: true },
    })
    await fulfillOrder(order.id)
    return NextResponse.json({ free: true, orderId: order.id }, { status: 201 })
  }

  if (!paymentsEnabled()) {
    return NextResponse.json({ error: "Paid tickets aren't available yet" }, { status: 503 })
  }

  const order = await db.order.create({
    data: { eventId, ticketTypeId, userId, quantity, amount, platformFee, status: "PENDING" },
    select: { id: true },
  })

  try {
    const rp = await createRazorpayOrder(Math.round(amount * 100), order.id, {
      eventId,
      ticketTypeId,
      userId,
    })
    await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: rp.id } })

    return NextResponse.json(
      {
        orderId: order.id,
        razorpayOrderId: rp.id,
        amount: Math.round(amount * 100),
        currency: "INR",
        keyId: RAZORPAY_KEY_ID,
        eventTitle: event.title,
        ticketName: tt.name,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("razorpay order create failed:", err)
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } })
    return NextResponse.json({ error: "Could not start checkout" }, { status: 502 })
  }
}
