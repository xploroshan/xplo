import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit
    const targetType = searchParams.get("targetType") // optional filter

    const where: Record<string, unknown> = {}
    if (targetType && ["organization", "user", "event"].includes(targetType)) {
      where.targetType = targetType
    }

    const [overrides, total] = await Promise.all([
      db.ratingOverrideLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      db.ratingOverrideLog.count({ where }),
    ])

    return NextResponse.json({
      overrides: overrides.map((o) => ({
        id: o.id,
        targetType: o.targetType,
        targetId: o.targetId,
        previousValue: o.previousValue,
        newValue: o.newValue,
        reason: o.reason,
        createdAt: o.createdAt,
        admin: o.admin,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("List rating overrides error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
