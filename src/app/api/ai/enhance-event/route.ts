import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import {
  getAnthropicClient,
  isAIAvailable,
  AI_MODEL,
  buildEventEnhancePrompt,
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

    // Only organizers and admins can enhance events
    const role = (session.user as { role?: string }).role
    if (!role || !["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Only organizers and admins can use this feature" },
        { status: 403 }
      )
    }

    const { success, remaining } = rateLimit(
      `ai-enhance:${session.user.id}`,
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
    const { title, eventType, startLocation, destination, startDate, endDate, capacity, price } =
      body as {
        title: string
        eventType: string
        startLocation?: string
        destination?: string
        startDate?: string
        endDate?: string
        capacity?: number
        price?: number
      }

    if (!title || !eventType) {
      return NextResponse.json(
        { error: "Title and eventType are required" },
        { status: 400 }
      )
    }

    const prompt = buildEventEnhancePrompt({
      title,
      eventType,
      startLocation,
      destination,
      startDate,
      endDate,
      capacity,
      price,
    })

    const client = getAnthropicClient()

    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    const text =
      response.content[0].type === "text" ? response.content[0].text : ""

    // Parse JSON response from Claude
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // Try extracting JSON from potential markdown wrapping
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        console.error("Failed to parse AI enhance response:", text)
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("AI enhance-event error:", error)
    return NextResponse.json(
      { error: "Failed to enhance event" },
      { status: 500 }
    )
  }
}
