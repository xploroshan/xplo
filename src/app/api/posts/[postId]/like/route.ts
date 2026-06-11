import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Toggle a like (FR-5.14): likedBy array + denormalized likesCount.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const me = session.user.id
  const { postId } = await params

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, likedBy: true },
  })
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const liked = post.likedBy.includes(me)
  const likedBy = liked ? post.likedBy.filter((u) => u !== me) : [...post.likedBy, me]

  await db.post.update({
    where: { id: postId },
    data: { likedBy, likesCount: likedBy.length },
  })

  // Notify the author on a fresh like (not on unlike, not on self-like).
  if (!liked && post.userId !== me) {
    await db.notification.create({
      data: {
        type: "LIKE",
        title: `${session.user.name || "Someone"} liked your post`,
        content: "",
        link: `/feed`,
        userId: post.userId,
        senderId: me,
      },
    })
  }

  return NextResponse.json({ liked: !liked, likes: likedBy.length })
}
