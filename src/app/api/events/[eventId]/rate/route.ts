import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizeInput } from "@/lib/sanitize"
import { ratingSubmissionSchema } from "@/lib/validations/rating"
import {
  recalcOrganizerRating,
  recalcOrganizationRating,
} from "@/lib/ratings"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit: 10 requests per minute per user
    const { success } = rateLimit(`rate:${session.user.id}`, 10, 60_000)
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const { eventId } = await params

    // Parse and validate request body
    const body = await request.json()
    const parsed = ratingSubmissionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { rating, review } = parsed.data

    // Fetch event with status and organizer info
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        organizerId: true,
        organizationId: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Event must be COMPLETED or ARCHIVED
    if (!["COMPLETED", "ARCHIVED"].includes(event.status)) {
      return NextResponse.json(
        { error: "Ratings can only be submitted for completed events" },
        { status: 400 }
      )
    }

    // User must be a CONFIRMED participant
    const participant = await db.eventParticipant.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    })

    if (!participant || participant.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "You must be a confirmed participant to rate this event" },
        { status: 403 }
      )
    }

    // Sanitize review if provided
    const sanitizedReview = review ? sanitizeInput(review) : null

    // Save rating and review
    const updated = await db.eventParticipant.update({
      where: { id: participant.id },
      data: {
        rating,
        review: sanitizedReview,
      },
    })

    // Recalculate organizer rating
    await recalcOrganizerRating(event.organizerId)

    // Recalculate organization rating if event belongs to one
    if (event.organizationId) {
      await recalcOrganizationRating(event.organizationId)
    }

    return NextResponse.json({ participant: updated }, { status: 200 })
  } catch (error) {
    console.error("Rating submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
