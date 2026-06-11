import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEventChatAccess } from "@/lib/chat"

const patchBody = z.object({ pinned: z.boolean() })

// Pin / unpin a message — organizer, admin, or moderator only (FR-3.7).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string; messageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId, messageId } = await params
  const access = await getEventChatAccess(eventId, session.user.id, session.user.role)
  if (!access) {
    return NextResponse.json({ error: "No access" }, { status: 403 })
  }
  if (!access.canModerate) {
    return NextResponse.json({ error: "Only the organizer can pin messages" }, { status: 403 })
  }

  const parsed = patchBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const msg = await db.message.findFirst({ where: { id: messageId, eventId }, select: { id: true } })
  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  await db.message.update({ where: { id: messageId }, data: { pinned: parsed.data.pinned } })
  return NextResponse.json({ pinned: parsed.data.pinned })
}

// Soft-delete a message — its author, or a moderator/organizer (FR-3.7).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string; messageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId, messageId } = await params
  const access = await getEventChatAccess(eventId, session.user.id, session.user.role)
  if (!access) {
    return NextResponse.json({ error: "No access" }, { status: 403 })
  }

  const msg = await db.message.findFirst({
    where: { id: messageId, eventId },
    select: { id: true, senderId: true },
  })
  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }
  if (msg.senderId !== session.user.id && !access.canModerate) {
    return NextResponse.json({ error: "You can only delete your own messages" }, { status: 403 })
  }

  await db.message.update({ where: { id: messageId }, data: { deleted: true, pinned: false } })
  return NextResponse.json({ deleted: true })
}
