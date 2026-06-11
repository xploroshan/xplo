import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "OPEN", "CLOSED", "ACTIVE", "COMPLETED", "ARCHIVED"] as const

const body = z.object({
  featured: z.boolean().optional(),
  status: z.enum(EVENT_STATUSES).optional(),
})

function isAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN"
}

// Admin moderation of an event (feature, status).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { eventId } = await params
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  await db.event.update({
    where: { id: eventId },
    data: {
      ...(parsed.data.featured !== undefined ? { featured: parsed.data.featured } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { eventId } = await params
  // Archive rather than hard-delete, to preserve orders/history.
  await db.event.update({ where: { id: eventId }, data: { status: "ARCHIVED" } })
  return NextResponse.json({ ok: true })
}
