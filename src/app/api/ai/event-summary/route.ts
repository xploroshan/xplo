import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import {
  getAnthropicClient,
  isAIAvailable,
  AI_MODEL,
  buildEventSummaryPrompt,
} from "@/lib/ai"

export async function POST(request: Request) {
  try {
    if (!isAIAvailable()) {
      return NextResponse.json(
        { error: "AI features are not configured" },
        { status: 503 }
      )
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only organizers and admins can generate event summaries
    const role = (session.user as { role?: string }).role
    if (!role || !["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Only organizers and admins can use this feature" },
        { status: 403 }
      )
    }

    const { success, remaining } = rateLimit(
      `ai-summary:${session.user.id}`,
      10,
      60 * 60 * 1000
    )
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", remaining },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { eventId } = body as { eventId: string }

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      )
    }

    // Fetch event + participant data
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        eventType: true,
        organizer: { select: { id: true, name: true } },
        participants: {
          select: {
            status: true,
            rating: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Verify the requesting user is the organizer or an admin
    if (
      event.organizerId !== session.user.id &&
      !["ADMIN", "SUPER_ADMIN"].includes(role)
    ) {
      return NextResponse.json(
        { error: "You can only generate summaries for your own events" },
        { status: 403 }
      )
    }

    const participantCount = event.participants.filter(
      (p) => p.status === "CONFIRMED"
    ).length

    // Count completed participants (those who have a rating = they finished)
    const ratingsRaw = event.participants
      .map((p) => {
        try {
          return typeof p.rating === "number" ? p.rating : null
        } catch {
          return null
        }
      })
      .filter((r): r is number => r !== null)

    const completedCount = ratingsRaw.length
    const avgRating =
      ratingsRaw.length > 0
        ? ratingsRaw.reduce((sum, r) => sum + r, 0) / ratingsRaw.length
        : 0

    const prompt = buildEventSummaryPrompt({
      title: event.title,
      type: event.eventType.name,
      participantCount,
      completedCount,
      avgRating: Math.round(avgRating * 10) / 10,
      description: event.description ?? undefined,
    })

    const client = getAnthropicClient()

    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const text =
      response.content[0].type === "text" ? response.content[0].text : ""

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        console.error("Failed to parse AI summary response:", text)
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      ...parsed,
      eventId: event.id,
      eventTitle: event.title,
      participantCount,
      completedCount,
      avgRating: Math.round(avgRating * 10) / 10,
    })
  } catch (error) {
    console.error("AI event-summary error:", error)
    return NextResponse.json(
      { error: "Failed to generate event summary" },
      { status: 500 }
    )
  }
}
