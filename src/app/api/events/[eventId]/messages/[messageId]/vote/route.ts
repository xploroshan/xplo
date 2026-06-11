import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEventChatAccess } from "@/lib/chat"
import { presentMessage, MESSAGE_SELECT, type MsgMeta } from "@/lib/chat-messages"
import { publishChange, eventChatChannel } from "@/lib/realtime"

const body = z.object({ option: z.number().int().min(0).max(5) })

// Cast (or change) a poll vote. Single-choice replaces; multi toggles.
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
    return NextResponse.json({ error: "Invalid option" }, { status: 400 })
  }

  const msg = await db.message.findFirst({
    where: { id: messageId, eventId, type: "POLL", deleted: false },
    select: { id: true, metadata: true },
  })
  if (!msg) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 })
  }
  const meta = ((msg.metadata as MsgMeta | null) ?? {}) as MsgMeta
  if (!meta.poll || parsed.data.option >= meta.poll.options.length) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 })
  }

  const votes: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(meta.poll.votes ?? {})) votes[k] = [...v]
  const key = String(parsed.data.option)
  const already = (votes[key] ?? []).includes(userId)

  if (!meta.poll.multi) {
    // Single choice: remove the user from every option first.
    for (const k of Object.keys(votes)) votes[k] = votes[k].filter((u) => u !== userId)
  }
  const set = new Set(votes[key] ?? [])
  if (already && meta.poll.multi) set.delete(userId)
  else set.add(userId)
  votes[key] = [...set]

  const updated = await db.message.update({
    where: { id: messageId },
    data: { metadata: { ...meta, poll: { ...meta.poll, votes } } as object },
    select: MESSAGE_SELECT,
  })

  await publishChange(eventChatChannel(eventId), "update")

  return NextResponse.json({ message: presentMessage(updated, userId) })
}
