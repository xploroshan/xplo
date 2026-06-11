import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizeInput } from "@/lib/sanitize"
import { getEventChatAccess } from "@/lib/chat"

const SELECT = {
  id: true,
  content: true,
  type: true,
  pinned: true,
  deleted: true,
  editedAt: true,
  createdAt: true,
  senderId: true,
  sender: { select: { id: true, name: true, image: true } },
  replyTo: {
    select: { id: true, content: true, deleted: true, sender: { select: { name: true } } },
  },
} as const

// Shape a message for the client (hide content of soft-deleted messages).
function present(m: {
  id: string
  content: string
  type: string
  pinned: boolean
  deleted: boolean
  editedAt: Date | null
  createdAt: Date
  senderId: string
  sender: { id: string; name: string | null; image: string | null }
  replyTo: { id: string; content: string; deleted: boolean; sender: { name: string | null } } | null
}) {
  return {
    id: m.id,
    content: m.deleted ? null : m.content,
    type: m.type,
    pinned: m.pinned,
    deleted: m.deleted,
    editedAt: m.editedAt,
    createdAt: m.createdAt,
    senderId: m.senderId,
    sender: m.sender,
    replyTo: m.replyTo
      ? { id: m.replyTo.id, content: m.replyTo.deleted ? null : m.replyTo.content, senderName: m.replyTo.sender.name }
      : null,
  }
}

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
  const after = url.searchParams.get("after") // ISO timestamp of the newest message the client has

  const where = after
    ? { eventId, createdAt: { gt: new Date(after) } }
    : { eventId }

  // For polling we want everything newer than `after`; for the initial load we
  // want the most recent 50 (then reverse to chronological order).
  const messages = await db.message.findMany({
    where,
    orderBy: { createdAt: after ? "asc" : "desc" },
    take: after ? 200 : 50,
    select: SELECT,
  })
  const ordered = after ? messages : messages.reverse()

  // Pinned messages (always surfaced at the top of the UI).
  const pinned = await db.message.findMany({
    where: { eventId, pinned: true, deleted: false },
    orderBy: { createdAt: "asc" },
    take: 5,
    select: SELECT,
  })

  return NextResponse.json({
    messages: ordered.map(present),
    pinned: pinned.map(present),
    chatActive: access.event.chatActive,
    canModerate: access.canModerate,
    me: session.user.id,
  })
}

const postBody = z.object({
  content: z.string().min(1).max(2000),
  replyToId: z.string().optional(),
})

export async function POST(
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
  if (!access.event.chatActive) {
    return NextResponse.json({ error: "This chat is read-only" }, { status: 403 })
  }

  const { success } = await rateLimit(`chat:${session.user.id}`, 30, 60_000)
  if (!success) {
    return NextResponse.json({ error: "Slow down a moment." }, { status: 429 })
  }

  const parsed = postBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  // A reply must reference a message in this same event.
  let replyToId: string | undefined
  if (parsed.data.replyToId) {
    const target = await db.message.findFirst({
      where: { id: parsed.data.replyToId, eventId },
      select: { id: true },
    })
    replyToId = target?.id
  }

  const message = await db.message.create({
    data: {
      content: sanitizeInput(parsed.data.content),
      type: "TEXT",
      eventId,
      senderId: session.user.id,
      replyToId,
    },
    select: SELECT,
  })

  return NextResponse.json({ message: present(message) }, { status: 201 })
}
