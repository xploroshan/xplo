import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const org = await db.organization.findUnique({
      where: { id },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    // Only allow specific admin-controlled fields
    if (body.status !== undefined) {
      if (!["PENDING", "ACTIVE", "SUSPENDED"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      updateData.status = body.status
    }

    if (body.verified !== undefined) {
      updateData.verified = Boolean(body.verified)
    }

    if (body.featured !== undefined) {
      updateData.featured = Boolean(body.featured)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await db.organization.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Admin update organization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
