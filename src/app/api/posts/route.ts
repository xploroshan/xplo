import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizeInput } from "@/lib/sanitize"
import { extractHashtags, POST_SELECT, presentPost } from "@/lib/posts"

// Feed (FR-5.9): ?filter=following narrows to people you follow; ?tag= filters
// by hashtag; ?before= paginates. Stories are excluded (they live in the strip).
export async function GET(request: Request) {
  const session = await auth()
  const me = session?.user?.id ?? null

  const url = new URL(request.url)
  const filter = url.searchParams.get("filter")
  const tag = url.searchParams.get("tag")?.toLowerCase()
  const before = url.searchParams.get("before")

  const where: Record<string, unknown> = {
    visibility: "public",
    isStory: false,
  }
  if (tag) where.hashtags = { has: tag }
  if (before) where.createdAt = { lt: new Date(before) }
  if (filter === "following") {
    if (!me) return NextResponse.json({ posts: [] })
    const follows = await db.follow.findMany({
      where: { followerId: me },
      select: { followingId: true },
    })
    where.userId = { in: [...follows.map((f) => f.followingId), me] }
  }

  const posts = await db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    select: POST_SELECT,
  })

  return NextResponse.json({ posts: posts.map((p) => presentPost(p, me)) })
}

const postBody = z
  .object({
    content: z.string().max(2200).optional(),
    images: z.array(z.string().url()).max(10).optional(),
    eventId: z.string().optional(),
    isStory: z.boolean().optional(),
  })
  .refine((d) => d.content?.trim() || (d.images && d.images.length > 0), {
    message: "Say something or add a photo",
  })

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { success } = await rateLimit(`post:${session.user.id}`, 10, 60 * 60_000)
  if (!success) {
    return NextResponse.json({ error: "Too many posts — take a breather." }, { status: 429 })
  }

  const parsed = postBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Say something or add a photo" }, { status: 400 })
  }
  const d = parsed.data

  // Stories need an image and expire in 24h (FR-5.19).
  if (d.isStory && (!d.images || d.images.length === 0)) {
    return NextResponse.json({ error: "A story needs a photo" }, { status: 400 })
  }

  // Optional event tag must reference a real event.
  let eventId: string | undefined
  if (d.eventId) {
    const ev = await db.event.findUnique({ where: { id: d.eventId }, select: { id: true } })
    eventId = ev?.id
  }

  const content = d.content ? sanitizeInput(d.content) : null
  const post = await db.post.create({
    data: {
      content,
      images: d.images ?? [],
      userId: session.user.id,
      eventId,
      hashtags: content ? extractHashtags(content) : [],
      isStory: !!d.isStory,
      expiresAt: d.isStory ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    },
    select: POST_SELECT,
  })

  return NextResponse.json({ post: presentPost(post, session.user.id) }, { status: 201 })
}
