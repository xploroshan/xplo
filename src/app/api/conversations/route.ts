import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getOrCreateConversation } from "@/lib/dm"

// List the user's direct-message threads (most recent first).
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const me = session.user.id

  const convs = await db.conversation.findMany({
    where: { OR: [{ userAId: me }, { userBId: me }] },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: {
      id: true,
      lastMessageAt: true,
      userA: { select: { id: true, name: true, image: true, slug: true } },
      userB: { select: { id: true, name: true, image: true, slug: true } },
    },
  })

  return NextResponse.json({
    conversations: convs.map((c) => ({
      id: c.id,
      lastMessageAt: c.lastMessageAt,
      other: c.userA.id === me ? c.userB : c.userA,
    })),
  })
}

const body = z.object({ userId: z.string().min(1) })

// Start (or fetch) a 1:1 conversation with another user.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }
  if (parsed.data.userId === session.user.id) {
    return NextResponse.json({ error: "You can't message yourself" }, { status: 400 })
  }

  const other = await db.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } })
  if (!other) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const conv = await getOrCreateConversation(session.user.id, other.id)
  return NextResponse.json({ id: conv?.id }, { status: 201 })
}
