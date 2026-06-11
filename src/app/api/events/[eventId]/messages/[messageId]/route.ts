import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sanitizeInput } from "@/lib/sanitize"
import { getEventChatAccess } from "@/lib/chat"

const patchBody = z.object({
  pinned: z.boolean().optional(),
  content: z.string().min(1).max(2000).optional(),
})

const EDIT_WINDOW_MS = 15 * 60 * 1000

// Pin/unpin (moderators) or edit your own message within 15 minutes (FR-3.7).
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

  const parsed = patchBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const msg = await db.message.findFirst({
    where: { id: messageId, eventId },
    select: { id: true, senderId: true, createdAt: true, type: true, deleted: true },
  })
  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  if (parsed.data.pinned !== undefined) {
    if (!access.canModerate) {
      return NextResponse.json({ error: "Only the organizer can pin messages" }, { status: 403 })
    }
    await db.message.update({ where: { id: messageId }, data: { pinned: parsed.data.pinned } })
    return NextResponse.json({ pinned: parsed.data.pinned })
  }

  if (parsed.data.content !== undefined) {
    if (msg.senderId !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 })
    }
    if (msg.deleted || msg.type === "POLL" || msg.type === "SYSTEM") {
      return NextResponse.json({ error: "This message can't be edited" }, { status: 400 })
    }
    if (Date.now() - msg.createdAt.getTime() > EDIT_WINDOW_MS) {
      return NextResponse.json({ error: "Edit window (15 min) has passed" }, { status: 400 })
    }
    await db.message.update({
      where: { id: messageId },
      data: { content: sanitizeInput(parsed.data.content), editedAt: new Date() },
    })
    return NextResponse.json({ edited: true })
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
}

// Soft-delete — author or moderator.
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
