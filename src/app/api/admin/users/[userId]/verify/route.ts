import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { verified: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { verified: !user.verified },
      select: { id: true, verified: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Verify user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
