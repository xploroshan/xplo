import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { followOrganizerSchema } from "@/lib/validations/organizer"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = followOrganizerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { organizerId } = parsed.data

    if (organizerId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const organizer = await db.user.findUnique({
      where: { id: organizerId },
      select: { role: true, name: true },
    })

    if (!organizer || !["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(organizer.role)) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 })
    }

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: organizerId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Already following" }, { status: 409 })
    }

    const follow = await db.follow.create({
      data: {
        followerId: session.user.id,
        followingId: organizerId,
      },
    })

    // Create notification for the organizer
    await db.notification.create({
      data: {
        type: "FOLLOW",
        title: "New Follower",
        content: `${session.user.name || "Someone"} started following you`,
        userId: organizerId,
        senderId: session.user.id,
        link: `/profile`,
      },
    })

    return NextResponse.json({ follow }, { status: 201 })
  } catch (error) {
    console.error("Follow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = followOrganizerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { organizerId } = parsed.data

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: organizerId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Not following" }, { status: 404 })
    }

    await db.follow.delete({ where: { id: existing.id } })

    return NextResponse.json({ message: "Unfollowed" })
  } catch (error) {
    console.error("Unfollow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
