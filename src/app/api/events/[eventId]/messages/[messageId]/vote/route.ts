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

  // Lock the poll row so concurrent votes serialize — otherwise two voters
  // reading the same tally would each write back, dropping one of the votes.
  const result = await db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ metadata: MsgMeta | null }[]>`
      SELECT "metadata" FROM "Message"
      WHERE "id" = ${messageId} AND "eventId" = ${eventId}
        AND "type" = 'POLL' AND "deleted" = false
      FOR UPDATE
    `
    if (locked.length === 0) return { error: "notfound" as const }

    const meta = (locked[0].metadata ?? {}) as MsgMeta
    if (!meta.poll || parsed.data.option >= meta.poll.options.length) {
      return { error: "invalid" as const }
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

    const updated = await tx.message.update({
      where: { id: messageId },
      data: { metadata: { ...meta, poll: { ...meta.poll, votes } } as object },
      select: MESSAGE_SELECT,
    })
    return { updated }
  })

  if ("error" in result) {
    return result.error === "notfound"
      ? NextResponse.json({ error: "Poll not found" }, { status: 404 })
      : NextResponse.json({ error: "Invalid option" }, { status: 400 })
  }

  await publishChange(eventChatChannel(eventId), "update")

  return NextResponse.json({ message: presentMessage(result.updated, userId) })
}
