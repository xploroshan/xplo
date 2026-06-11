import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Toggle a "remind me when it opens" reminder for an event.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true } })
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  await db.eventReminder.upsert({
    where: { userId_eventId: { userId: session.user.id, eventId } },
    update: {},
    create: { userId: session.user.id, eventId },
  })

  return NextResponse.json({ reminding: true }, { status: 201 })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params

  await db.eventReminder
    .delete({ where: { userId_eventId: { userId: session.user.id, eventId } } })
    .catch(() => null)

  return NextResponse.json({ reminding: false })
}
