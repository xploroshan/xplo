import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import {
  getAnthropicClient,
  isAIAvailable,
  AI_MODEL,
  buildAccommodationPrompt,
  generateBookingLinks,
} from "@/lib/ai"

export async function GET(request: Request) {
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

    const { success, remaining } = rateLimit(
      `ai-accommodations:${session.user.id}`,
      20,
      60 * 60 * 1000
    )
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", remaining },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const destinationParam = searchParams.get("destination")
    const startDateParam = searchParams.get("startDate")
    const eventTypeParam = searchParams.get("eventType")

    let destination: string
    let startDate: string
    let eventType: string
    let resolvedEventId: string | undefined

    if (eventId) {
      const event = await db.event.findUnique({
        where: { id: eventId },
        include: { eventType: true },
      })
      if (!event) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        )
      }

      // Check cache first
      try {
        const eventData = event as Record<string, unknown>
        if (eventData.nearbyAccommodation) {
          return NextResponse.json(eventData.nearbyAccommodation)
        }
      } catch {
        // Field may not exist yet
      }

      const dest = event.destination as { address?: string } | null
      if (!dest?.address) {
        return NextResponse.json(
          { error: "Event has no destination set" },
          { status: 400 }
        )
      }
      destination = dest.address
      startDate = event.startDate.toISOString()
      eventType = event.eventType.name
      resolvedEventId = eventId
    } else if (destinationParam && startDateParam && eventTypeParam) {
      destination = destinationParam
      startDate = startDateParam
      eventType = eventTypeParam
    } else {
      return NextResponse.json(
        { error: "Provide eventId or destination, startDate, and eventType" },
        { status: 400 }
      )
    }

    const prompt = buildAccommodationPrompt({ destination, startDate, eventType })
    const client = getAnthropicClient()

    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    const text =
      response.content[0].type === "text" ? response.content[0].text : ""

    let parsed: {
      accommodations: {
        name: string
        type: string
        priceRange: string
        budgetTier: string
        rating: string
        description: string
        amenities: string[]
        distanceFromEvent: string
        bookingLinks?: ReturnType<typeof generateBookingLinks>
      }[]
    }
    try {
      parsed = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        console.error("Failed to parse AI accommodation response:", text)
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        )
      }
    }

    // Post-process: add booking links for each accommodation
    const checkIn = startDate.split("T")[0]
    if (parsed.accommodations && Array.isArray(parsed.accommodations)) {
      parsed.accommodations = parsed.accommodations.map((acc) => ({
        ...acc,
        bookingLinks: generateBookingLinks(acc.name, destination, checkIn),
      }))
    }

    // Cache result in DB if eventId was provided
    if (resolvedEventId) {
      try {
        await (db.event as Record<string, unknown> & typeof db.event).update({
          where: { id: resolvedEventId },
          data: { nearbyAccommodation: parsed } as Record<string, unknown>,
        })
      } catch {
        // Field may not exist in schema yet - graceful degradation
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("AI accommodations error:", error)
    return NextResponse.json(
      { error: "Failed to fetch accommodations" },
      { status: 500 }
    )
  }
}
