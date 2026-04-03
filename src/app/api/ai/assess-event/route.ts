import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import {
  getAnthropicClient,
  isAIAvailable,
  AI_MODEL,
  buildAssessmentPrompt,
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

    const { success, remaining } = rateLimit(
      `ai-assess:${session.user.id}`,
      20,
      60 * 60 * 1000
    )
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", remaining },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { eventId, title, type, description, startLocation, destination } =
      body as {
        eventId?: string
        title?: string
        type?: string
        description?: string
        startLocation?: string
        destination?: string
      }

    let assessmentInput: {
      title: string
      type: string
      description?: string
      startLocation?: string
      destination?: string
    }

    if (eventId) {
      // Look up event from DB
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
      const startLoc = event.startLocation as { address?: string } | null
      const dest = event.destination as { address?: string } | null
      assessmentInput = {
        title: event.title,
        type: event.eventType.name,
        description: event.description ?? undefined,
        startLocation: startLoc?.address,
        destination: dest?.address,
      }
    } else if (title && type) {
      assessmentInput = { title, type, description, startLocation, destination }
    } else {
      return NextResponse.json(
        { error: "Provide either eventId or title and type" },
        { status: 400 }
      )
    }

    const prompt = buildAssessmentPrompt(assessmentInput)
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
        console.error("Failed to parse AI assessment response:", text)
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        )
      }
    }

    // Try to cache result in DB if eventId was provided
    if (eventId) {
      try {
        await (db.event as Record<string, unknown> & typeof db.event).update({
          where: { id: eventId },
          data: {
            aiAssessment: parsed,
            difficulty: parsed.difficulty?.level,
          } as Record<string, unknown>,
        })
      } catch {
        // Fields may not exist in schema yet - graceful degradation
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("AI assess-event error:", error)
    return NextResponse.json(
      { error: "Failed to assess event" },
      { status: 500 }
    )
  }
}
