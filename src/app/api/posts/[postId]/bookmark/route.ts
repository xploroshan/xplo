import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Toggle a bookmark (FR-5.17).
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
    select: { bookmarkedBy: true },
  })
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const bookmarked = post.bookmarkedBy.includes(me)
  await db.post.update({
    where: { id: postId },
    data: {
      bookmarkedBy: bookmarked
        ? post.bookmarkedBy.filter((u) => u !== me)
        : [...post.bookmarkedBy, me],
    },
  })

  return NextResponse.json({ bookmarked: !bookmarked })
}
