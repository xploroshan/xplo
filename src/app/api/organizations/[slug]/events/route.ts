import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const org = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // "upcoming" or "past"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")))
    const skip = (page - 1) * limit

    const now = new Date()
    const where: Record<string, unknown> = {
      organizationId: org.id,
    }

    if (status === "upcoming") {
      where.startDate = { gte: now }
      where.status = { in: ["PUBLISHED", "OPEN", "ACTIVE"] }
    } else if (status === "past") {
      where.OR = [
        { endDate: { lt: now } },
        { startDate: { lt: now }, endDate: null, status: "COMPLETED" },
      ]
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: status === "past" ? "desc" : "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          startDate: true,
          endDate: true,
          startLocation: true,
          destination: true,
          capacity: true,
          price: true,
          currency: true,
          status: true,
          difficulty: true,
          eventType: {
            select: { name: true, icon: true, color: true },
          },
          organizer: {
            select: {
              id: true,
              name: true,
              image: true,
              slug: true,
            },
          },
          _count: {
            select: { participants: { where: { status: "CONFIRMED" } } },
          },
        },
      }),
      db.event.count({ where }),
    ])

    return NextResponse.json({
      events: events.map((e) => ({
        ...e,
        participantCount: e._count.participants,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("List organization events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
