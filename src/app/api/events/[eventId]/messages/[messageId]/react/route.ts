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

  // Lock the row for the read-modify-write so two simultaneous reactions on the
  // same message can't overwrite each other's JSON metadata (lost update).
  const updated = await db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ metadata: MsgMeta | null }[]>`
      SELECT "metadata" FROM "Message"
      WHERE "id" = ${messageId} AND "eventId" = ${eventId} AND "deleted" = false
      FOR UPDATE
    `
    if (locked.length === 0) return null

    const meta = (locked[0].metadata ?? {}) as MsgMeta
    const reactions = { ...(meta.reactions ?? {}) }
    const users = new Set(reactions[emoji] ?? [])
    if (users.has(userId)) users.delete(userId)
    else users.add(userId)
    if (users.size === 0) delete reactions[emoji]
    else reactions[emoji] = [...users]

    return tx.message.update({
      where: { id: messageId },
      data: { metadata: { ...meta, reactions } as object },
      select: MESSAGE_SELECT,
    })
  })

  if (!updated) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  await publishChange(eventChatChannel(eventId), "update")

  return NextResponse.json({ message: presentMessage(updated, userId) })
}
