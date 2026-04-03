import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
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

    const [
      // Users by role
      totalUsers,
      usersByRole,
      // Events by status
      totalEvents,
      eventsByStatus,
      // Organizations by status
      totalOrganizations,
      orgsByStatus,
      // Ratings
      ratingStats,
    ] = await Promise.all([
      db.user.count(),
      db.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      db.event.count(),
      db.event.groupBy({
        by: ["status"],
        _count: true,
      }),
      db.organization.count(),
      db.organization.groupBy({
        by: ["status"],
        _count: true,
      }),
      db.eventParticipant.aggregate({
        where: { rating: { not: null } },
        _count: { rating: true },
        _avg: { rating: true },
      }),
    ])

    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: Object.fromEntries(
          usersByRole.map((r) => [r.role, r._count])
        ),
      },
      events: {
        total: totalEvents,
        byStatus: Object.fromEntries(
          eventsByStatus.map((e) => [e.status, e._count])
        ),
      },
      organizations: {
        total: totalOrganizations,
        byStatus: Object.fromEntries(
          orgsByStatus.map((o) => [o.status, o._count])
        ),
      },
      ratings: {
        totalRatings: ratingStats._count.rating,
        avgPlatformRating: ratingStats._avg.rating,
      },
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
