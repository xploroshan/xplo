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

  // Atomic toggle — see the like route for why this beats read-modify-write.
  const rows = await db.$queryRaw<{ bookmarkedBy: string[] }[]>`
    UPDATE "Post"
    SET "bookmarkedBy" = CASE WHEN ${me} = ANY("bookmarkedBy")
                              THEN array_remove("bookmarkedBy", ${me})
                              ELSE array_append("bookmarkedBy", ${me}) END
    WHERE "id" = ${postId}
    RETURNING "bookmarkedBy"
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const bookmarked = rows[0].bookmarkedBy.includes(me)
  return NextResponse.json({ bookmarked })
}
