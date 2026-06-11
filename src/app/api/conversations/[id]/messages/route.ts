import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizeInput } from "@/lib/sanitize"
import { getConversationAccess } from "@/lib/dm"
import { publishChange, conversationChannel } from "@/lib/realtime"

const SELECT = {
  id: true,
  content: true,
  deleted: true,
  createdAt: true,
  senderId: true,
  sender: { select: { id: true, name: true, image: true } },
} as const

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const access = await getConversationAccess(id, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "No access" }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const after = sp.get("after")
  const before = sp.get("before")
  const PAGE = 50

  // History paging — scroll up into older DMs.
  if (before) {
    const older = await db.message.findMany({
      where: { conversationId: id, createdAt: { lt: new Date(before) } },
      orderBy: { createdAt: "desc" },
      take: PAGE,
      select: SELECT,
    })
    return NextResponse.json({
      messages: older.reverse().map((m) => ({ ...m, content: m.deleted ? null : m.content })),
      hasMore: older.length === PAGE,
    })
  }

  const where = after
    ? { conversationId: id, createdAt: { gt: new Date(after) } }
    : { conversationId: id }
  const messages = await db.message.findMany({
    where,
    orderBy: { createdAt: after ? "asc" : "desc" },
    take: after ? 200 : PAGE,
    select: SELECT,
  })
  const ordered = after ? messages : messages.reverse()

  return NextResponse.json({
    messages: ordered.map((m) => ({ ...m, content: m.deleted ? null : m.content })),
    hasMore: !after && ordered.length === PAGE,
    me: session.user.id,
  })
}

const body = z.object({ content: z.string().min(1).max(2000) })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const access = await getConversationAccess(id, session.user.id)
  if (!access) {
    return NextResponse.json({ error: "No access" }, { status: 403 })
  }

  const { success } = await rateLimit(`dm:${session.user.id}`, 30, 60_000)
  if (!success) {
    return NextResponse.json({ error: "Slow down a moment." }, { status: 429 })
  }

  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  const message = await db.message.create({
    data: {
      content: sanitizeInput(parsed.data.content),
      type: "TEXT",
      conversationId: id,
      senderId: session.user.id,
    },
    select: SELECT,
  })
  await db.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } })

  // Notify the recipient.
  await db.notification.create({
    data: {
      type: "MESSAGE",
      title: `${session.user.name || "Someone"} messaged you`,
      content: parsed.data.content.slice(0, 120),
      link: `/messages/dm/${id}`,
      userId: access.otherId,
      senderId: session.user.id,
    },
  })

  await publishChange(conversationChannel(id), "new")

  return NextResponse.json({ message: { ...message, content: message.content } }, { status: 201 })
}
