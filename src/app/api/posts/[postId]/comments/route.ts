import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizeInput } from "@/lib/sanitize"

const SELECT = {
  id: true,
  content: true,
  createdAt: true,
  userId: true,
  user: { select: { id: true, name: true, image: true } },
} as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const comments = await db.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: SELECT,
  })
  return NextResponse.json({ comments })
}

const body = z.object({ content: z.string().min(1).max(1000) })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { postId } = await params

  const { success } = await rateLimit(`comment:${session.user.id}`, 20, 60_000)
  if (!success) {
    return NextResponse.json({ error: "Slow down a moment." }, { status: 429 })
  }

  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Comment is required" }, { status: 400 })
  }

  const post = await db.post.findUnique({ where: { id: postId }, select: { userId: true } })
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const comment = await db.comment.create({
    data: { content: sanitizeInput(parsed.data.content), postId, userId: session.user.id },
    select: SELECT,
  })

  if (post.userId !== session.user.id) {
    await db.notification.create({
      data: {
        type: "COMMENT",
        title: `${session.user.name || "Someone"} commented on your post`,
        content: parsed.data.content.slice(0, 120),
        link: `/feed`,
        userId: post.userId,
        senderId: session.user.id,
      },
    })
  }

  return NextResponse.json({ comment }, { status: 201 })
}
