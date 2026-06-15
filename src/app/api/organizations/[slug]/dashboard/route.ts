import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEffectiveRating } from "@/lib/ratings"

// Members-only dashboard stats for an organization. Shape matches what
// src/app/org/[slug]/dashboard/page.tsx expects.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const org = await db.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        avgRating: true,
        ratingOverride: true,
        ratingLocked: true,
        members: { where: { userId: session.user.id }, select: { id: true } },
        _count: { select: { events: true, members: true } },
      },
    })
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }
    // Only members may see the dashboard.
    if (org.members.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [eventsThisMonth, newMembers, participantStats, recent] = await Promise.all([
      db.event.count({
        where: { organizationId: org.id, startDate: { gte: startOfMonth } },
      }),
      db.organizationMember.count({
        where: { organizationId: org.id, joinedAt: { gte: startOfMonth } },
      }),
      db.eventParticipant.aggregate({
        where: { event: { organizationId: org.id }, status: "CONFIRMED" },
        _count: true,
      }),
      db.event.findMany({
        where: { organizationId: org.id },
        orderBy: { startDate: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          startDate: true,
          _count: { select: { participants: { where: { status: "CONFIRMED" } } } },
        },
      }),
    ])

    return NextResponse.json({
      stats: {
        eventsThisMonth,
        newMembers,
        avgRating: getEffectiveRating(org.avgRating, org.ratingOverride, org.ratingLocked),
        totalEvents: org._count.events,
        totalMembers: org._count.members,
        totalParticipants: participantStats._count,
      },
      recentEvents: recent.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        status: e.status,
        startDate: e.startDate,
        participantCount: e._count.participants,
      })),
    })
  } catch (error) {
    console.error("Org dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
