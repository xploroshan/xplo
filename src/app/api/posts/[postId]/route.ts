import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Delete your own post (admins can moderate any).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { postId } = await params

  const post = await db.post.findUnique({ where: { id: postId }, select: { userId: true } })
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
  if (post.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "You can only delete your own posts" }, { status: 403 })
  }

  await db.post.delete({ where: { id: postId } })
  return NextResponse.json({ deleted: true })
}
