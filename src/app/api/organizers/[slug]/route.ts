import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organizer = await db.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        city: true,
        slug: true,
        verified: true,
        socialLinks: true,
        createdAt: true,
        role: true,
        _count: {
          select: {
            organizedEvents: true,
            followers: true,
          },
        },
      },
    })

    if (!organizer || !["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(organizer.role)) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 })
    }

    // Aggregate stats: total confirmed participants across all events
    const participantStats = await db.eventParticipant.aggregate({
      where: {
        event: { organizerId: organizer.id },
        status: "CONFIRMED",
      },
      _count: true,
    })

    // Average rating across all events
    const ratingStats = await db.eventParticipant.aggregate({
      where: {
        event: { organizerId: organizer.id },
        rating: { not: null },
      },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return NextResponse.json({
      id: organizer.id,
      name: organizer.name,
      image: organizer.image,
      bio: organizer.bio,
      city: organizer.city,
      slug: organizer.slug,
      verified: organizer.verified,
      socialLinks: organizer.socialLinks,
      createdAt: organizer.createdAt,
      stats: {
        eventsCount: organizer._count.organizedEvents,
        followersCount: organizer._count.followers,
        totalParticipants: participantStats._count,
        avgRating: ratingStats._avg.rating,
        ratingCount: ratingStats._count.rating,
      },
    })
  } catch (error) {
    console.error("Organizer profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
