import { NextResponse } from "next/server"
import type { EventStatus } from "@prisma/client"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get("tab") || "upcoming"
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = 12

    const organizer = await db.user.findUnique({
      where: { slug },
      select: { id: true, role: true },
    })

    if (!organizer || !["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(organizer.role)) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 })
    }

    const statusFilter =
      tab === "past"
        ? { in: ["COMPLETED", "ARCHIVED"] as EventStatus[] }
        : { in: ["PUBLISHED", "OPEN", "ACTIVE"] as EventStatus[] }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where: {
          organizerId: organizer.id,
          status: statusFilter,
        },
        orderBy: { startDate: tab === "past" ? "desc" : "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          destination: true,
          capacity: true,
          coverImage: true,
          status: true,
          price: true,
          currency: true,
          eventType: {
            select: { name: true, color: true, icon: true },
          },
          _count: {
            select: {
              participants: { where: { status: "CONFIRMED" } },
            },
          },
        },
      }),
      db.event.count({
        where: {
          organizerId: organizer.id,
          status: statusFilter,
        },
      }),
    ])

    return NextResponse.json({
      events: events.map((e) => ({
        ...e,
        registeredCount: e._count.participants,
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
    console.error("Organizer events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
