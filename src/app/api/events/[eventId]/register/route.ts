import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    const event = await db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        capacity: true,
        requiresApproval: true,
        organizerId: true,
        _count: { select: { participants: { where: { status: "CONFIRMED" } } } },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!["PUBLISHED", "OPEN", "ACTIVE"].includes(event.status)) {
      return NextResponse.json({ error: "Event is not accepting registrations" }, { status: 400 })
    }

    if (event.organizerId === session.user.id) {
      return NextResponse.json({ error: "You are the organizer of this event" }, { status: 400 })
    }

    // Check for existing registration
    const existing = await db.eventParticipant.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId } },
    })

    if (existing && existing.status !== "CANCELLED") {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 409 })
    }

    // Determine status
    let status: "PENDING" | "CONFIRMED" | "WAITLISTED" = "CONFIRMED"
    if (event.requiresApproval) {
      status = "PENDING"
    } else if (event.capacity && event._count.participants >= event.capacity) {
      status = "WAITLISTED"
    }

    const participant = existing
      ? await db.eventParticipant.update({
          where: { id: existing.id },
          data: { status, joinedAt: new Date() },
        })
      : await db.eventParticipant.create({
          data: {
            userId: session.user.id,
            eventId,
            status,
          },
        })

    return NextResponse.json({ participant, status }, { status: 201 })
  } catch (error) {
    console.error("Event registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    const existing = await db.eventParticipant.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId } },
    })

    if (!existing || existing.status === "CANCELLED") {
      return NextResponse.json({ error: "Not registered for this event" }, { status: 404 })
    }

    await db.eventParticipant.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ message: "Registration cancelled" })
  } catch (error) {
    console.error("Event unregister error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
