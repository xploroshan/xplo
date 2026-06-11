import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizeInput } from "@/lib/sanitize"
import { getEventChatAccess } from "@/lib/chat"
import {
  MESSAGE_SELECT,
  presentMessage,
  resolveMentions,
  getEventMembers,
  type MsgMeta,
} from "@/lib/chat-messages"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params
  const access = await getEventChatAccess(eventId, session.user.id, session.user.role)
  if (!access) {
    return NextResponse.json({ error: "No access to this chat" }, { status: 403 })
  }

  const url = new URL(request.url)
  const after = url.searchParams.get("after")
  const q = url.searchParams.get("q")?.trim()

  // Search mode — return matching (non-deleted) messages newest-first.
  if (q) {
    const found = await db.message.findMany({
      where: { eventId, deleted: false, content: { contains: q, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: MESSAGE_SELECT,
    })
    return NextResponse.json({ results: found.map((m) => presentMessage(m, session.user.id)) })
  }

  const where = after ? { eventId, createdAt: { gt: new Date(after) } } : { eventId }
  const messages = await db.message.findMany({
    where,
    orderBy: { createdAt: after ? "asc" : "desc" },
    take: after ? 200 : 50,
    select: MESSAGE_SELECT,
  })
  const ordered = after ? messages : messages.reverse()

  const pinned = await db.message.findMany({
    where: { eventId, pinned: true, deleted: false },
    orderBy: { createdAt: "asc" },
    take: 5,
    select: MESSAGE_SELECT,
  })

  return NextResponse.json({
    messages: ordered.map((m) => presentMessage(m, session.user.id)),
    pinned: pinned.map((m) => presentMessage(m, session.user.id)),
    chatActive: access.event.chatActive,
    canModerate: access.canModerate,
    me: session.user.id,
  })
}

const postBody = z
  .object({
    content: z.string().max(2000).optional(),
    imageUrl: z.string().url().optional(),
    replyToId: z.string().optional(),
    poll: z
      .object({
        question: z.string().min(1).max(200),
        options: z.array(z.string().min(1).max(80)).min(2).max(6),
        multi: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((d) => d.content?.trim() || d.imageUrl || d.poll, {
    message: "A message, image, or poll is required",
  })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id
  const { eventId } = await params
  const access = await getEventChatAccess(eventId, userId, session.user.role)
  if (!access) {
    return NextResponse.json({ error: "No access to this chat" }, { status: 403 })
  }
  if (!access.event.chatActive) {
    return NextResponse.json({ error: "This chat is read-only" }, { status: 403 })
  }

  const { success } = await rateLimit(`chat:${userId}`, 30, 60_000)
  if (!success) {
    return NextResponse.json({ error: "Slow down a moment." }, { status: 429 })
  }

  const parsed = postBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }
  const d = parsed.data

  let replyToId: string | undefined
  if (d.replyToId) {
    const target = await db.message.findFirst({ where: { id: d.replyToId, eventId }, select: { id: true } })
    replyToId = target?.id
  }

  let type: "TEXT" | "IMAGE" | "POLL" = "TEXT"
  let content = d.content ? sanitizeInput(d.content) : ""
  const metadata: MsgMeta = {}

  if (d.poll) {
    type = "POLL"
    content = sanitizeInput(d.poll.question)
    metadata.poll = {
      question: content,
      options: d.poll.options.map((o) => sanitizeInput(o)),
      votes: {},
      multi: d.poll.multi,
    }
  } else if (d.imageUrl) {
    type = "IMAGE"
    metadata.imageUrl = d.imageUrl
  }

  // @mentions (text/caption only — skip the member lookup unless there's an @)
  let mentionIds: string[] = []
  if (content && type !== "POLL" && content.includes("@")) {
    const members = await getEventMembers(eventId)
    mentionIds = resolveMentions(content, members).filter((id) => id !== userId)
    if (mentionIds.length > 0) metadata.mentions = mentionIds
  }

  const message = await db.message.create({
    data: {
      content,
      type,
      metadata: metadata as object,
      eventId,
      senderId: userId,
      replyToId,
    },
    select: MESSAGE_SELECT,
  })

  // Notify mentioned members.
  if (mentionIds.length > 0) {
    await db.notification.createMany({
      data: mentionIds.map((id) => ({
        type: "MENTION" as const,
        title: `${session.user!.name || "Someone"} mentioned you`,
        content: `In "${access.event.title}": ${content.slice(0, 120)}`,
        link: `/events/${access.event.slug}/chat`,
        userId: id,
        senderId: userId,
      })),
    })
  }

  return NextResponse.json({ message: presentMessage(message, userId) }, { status: 201 })
}
