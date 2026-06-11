import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { verifyPaymentSignature } from "@/lib/razorpay"
import { fulfillOrder } from "@/lib/orders"

const body = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

// Checkout success callback: verify the signature, then fulfill (idempotent —
// the webhook is the backstop if the browser never calls this).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { orderId } = await params

  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, razorpayOrderId: true, event: { select: { slug: true } } },
  })
  if (!order || order.userId !== session.user.id || !order.razorpayOrderId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const ok = verifyPaymentSignature(
    order.razorpayOrderId,
    parsed.data.razorpayPaymentId,
    parsed.data.razorpaySignature
  )
  if (!ok) {
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } })
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
  }

  await fulfillOrder(order.id, parsed.data.razorpayPaymentId)
  return NextResponse.json({ paid: true, eventSlug: order.event.slug })
}
