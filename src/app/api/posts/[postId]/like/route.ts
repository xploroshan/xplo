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

  // Toggle atomically in a single statement so concurrent likes can't clobber
  // each other (the old read-modify-write lost updates under contention). The
  // CASE branches all evaluate against the pre-update row, so they stay
  // consistent, and likesCount is kept in lockstep with the array.
  const rows = await db.$queryRaw<{ likedBy: string[]; userId: string }[]>`
    UPDATE "Post"
    SET "likedBy" = CASE WHEN ${me} = ANY("likedBy")
                         THEN array_remove("likedBy", ${me})
                         ELSE array_append("likedBy", ${me}) END,
        "likesCount" = CASE WHEN ${me} = ANY("likedBy")
                         THEN cardinality(array_remove("likedBy", ${me}))
                         ELSE cardinality(array_append("likedBy", ${me})) END
    WHERE "id" = ${postId}
    RETURNING "likedBy", "userId"
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const likedBy = rows[0].likedBy
  const liked = likedBy.includes(me)

  // Notify the author on a fresh like (not on unlike, not on self-like).
  if (liked && rows[0].userId !== me) {
    await db.notification.create({
      data: {
        type: "LIKE",
        title: `${session.user.name || "Someone"} liked your post`,
        content: "",
        link: `/feed`,
        userId: rows[0].userId,
        senderId: me,
      },
    })
  }

  return NextResponse.json({ liked, likes: likedBy.length })
}
