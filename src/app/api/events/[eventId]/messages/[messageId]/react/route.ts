import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEventChatAccess } from "@/lib/chat"
import { presentMessage, MESSAGE_SELECT, type MsgMeta } from "@/lib/chat-messages"
import { publishChange, eventChatChannel } from "@/lib/realtime"

// A small allowlist keeps reactions tidy and avoids arbitrary payloads.
const ALLOWED = ["👍", "❤️", "🔥", "😂", "🎉", "😮", "😢", "🙏"]
const body = z.object({ emoji: z.string().refine((e) => ALLOWED.includes(e), "Unsupported reaction") })

// Toggle a reaction on a message (any chat member).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string; messageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id
  const { eventId, messageId } = await params
  const access = await getEventChatAccess(eventId, userId, session.user.role)
  if (!access) {
    return NextResponse.json({ error: "No access" }, { status: 403 })
  }

  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reaction" }, { status: 400 })
  }
  const emoji = parsed.data.emoji

  const msg = await db.message.findFirst({
    where: { id: messageId, eventId, deleted: false },
    select: { id: true, metadata: true },
  })
  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  const meta = ((msg.metadata as MsgMeta | null) ?? {}) as MsgMeta
  const reactions = { ...(meta.reactions ?? {}) }
  const users = new Set(reactions[emoji] ?? [])
  if (users.has(userId)) users.delete(userId)
  else users.add(userId)
  if (users.size === 0) delete reactions[emoji]
  else reactions[emoji] = [...users]

  const updated = await db.message.update({
    where: { id: messageId },
    data: { metadata: { ...meta, reactions } as object },
    select: MESSAGE_SELECT,
  })

  await publishChange(eventChatChannel(eventId), "update")

  return NextResponse.json({ message: presentMessage(updated, userId) })
}
