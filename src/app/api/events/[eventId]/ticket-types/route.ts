import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sanitizeInput } from "@/lib/sanitize"

async function assertOrganizer(eventId: string, userId: string, role?: string) {
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, organizerId: true } })
  if (!event) return { error: "not_found" as const }
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
  if (event.organizerId !== userId && !isAdmin) return { error: "forbidden" as const }
  return { event }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const types = await db.ticketType.findMany({
    where: { eventId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, description: true, price: true, quantity: true, sold: true, currency: true },
  })
  return NextResponse.json({
    ticketTypes: types.map((t) => ({
      ...t,
      price: Number(t.price),
      soldOut: t.quantity != null && t.sold >= t.quantity,
    })),
  })
}

const createBody = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  price: z.number().nonnegative().max(1_000_000),
  quantity: z.number().int().positive().max(100_000).nullable().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { eventId } = await params
  const a = await assertOrganizer(eventId, session.user.id, session.user.role)
  if ("error" in a) {
    return NextResponse.json({ error: a.error === "not_found" ? "Event not found" : "Forbidden" }, { status: a.error === "not_found" ? 404 : 403 })
  }

  const parsed = createBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }
  const count = await db.ticketType.count({ where: { eventId } })
  const created = await db.ticketType.create({
    data: {
      eventId,
      name: sanitizeInput(parsed.data.name),
      description: parsed.data.description ? sanitizeInput(parsed.data.description) : null,
      price: parsed.data.price,
      quantity: parsed.data.quantity ?? null,
      sortOrder: count,
    },
    select: { id: true },
  })
  return NextResponse.json({ id: created.id }, { status: 201 })
}
