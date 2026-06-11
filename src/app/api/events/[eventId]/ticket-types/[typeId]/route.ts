import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function assertOrganizer(eventId: string, userId: string, role?: string) {
  const event = await db.event.findUnique({ where: { id: eventId }, select: { organizerId: true } })
  if (!event) return false
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
  return event.organizerId === userId || isAdmin
}

// Deactivate a ticket type (kept, not hard-deleted, so existing orders stay
// intact). Organizer only.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string; typeId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { eventId, typeId } = await params
  if (!(await assertOrganizer(eventId, session.user.id, session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  await db.ticketType.updateMany({ where: { id: typeId, eventId }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
