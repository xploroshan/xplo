import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import {
  getAnthropicClient,
  isAIAvailable,
  AI_MODEL,
  buildPOIPrompt,
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
      `ai-poi:${session.user.id}`,
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
    const eventTypeParam = searchParams.get("eventType")

    let destination: string
    let eventType: string
    let startLocation: string | undefined
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
        if (eventData.nearbyPoi) {
          return NextResponse.json(eventData.nearbyPoi)
        }
      } catch {
        // Field may not exist yet
      }

      const dest = event.destination as { address?: string } | null
      const start = event.startLocation as { address?: string } | null
      if (!dest?.address) {
        return NextResponse.json(
          { error: "Event has no destination set" },
          { status: 400 }
        )
      }
      destination = dest.address
      eventType = event.eventType.name
      startLocation = start?.address
      resolvedEventId = eventId
    } else if (destinationParam && eventTypeParam) {
      destination = destinationParam
      eventType = eventTypeParam
    } else {
      return NextResponse.json(
        { error: "Provide eventId or destination and eventType" },
        { status: 400 }
      )
    }

    const prompt = buildPOIPrompt({ destination, eventType, startLocation })
    const client = getAnthropicClient()

    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
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
        console.error("Failed to parse AI POI response:", text)
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        )
      }
    }

    // Cache result in DB if eventId was provided
    if (resolvedEventId) {
      try {
        await (db.event as Record<string, unknown> & typeof db.event).update({
          where: { id: resolvedEventId },
          data: { nearbyPoi: parsed } as Record<string, unknown>,
        })
      } catch {
        // Field may not exist in schema yet - graceful degradation
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("AI places-of-interest error:", error)
    return NextResponse.json(
      { error: "Failed to fetch places of interest" },
      { status: 500 }
    )
  }
}
