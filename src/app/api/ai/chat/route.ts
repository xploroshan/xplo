import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import {
  getAnthropicClient,
  isAIAvailable,
  AI_MODEL,
  buildTripAdvisorPrompt,
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
      `ai-chat:${session.user.id}`,
      20,
      60 * 1000
    )
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", remaining },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { message, context } = body as {
      message: string
      context: {
        page: string
        eventSlug?: string
        history: { role: string; content: string }[]
      }
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Build context for the system prompt
    let eventDetails: {
      title: string
      type: string
      description?: string
      startLocation?: string
      destination?: string
      startDate?: string
    } | undefined

    if (context?.eventSlug) {
      try {
        const event = await db.event.findUnique({
          where: { slug: context.eventSlug },
          include: { eventType: true },
        })
        if (event) {
          const startLoc = event.startLocation as { address?: string } | null
          const dest = event.destination as { address?: string } | null
          eventDetails = {
            title: event.title,
            type: event.eventType.name,
            description: event.description ?? undefined,
            startLocation: startLoc?.address,
            destination: dest?.address,
            startDate: event.startDate.toISOString(),
          }
        }
      } catch (err) {
        console.error("Failed to fetch event for chat context:", err)
      }
    }

    // Fetch user info for personalization
    let userName: string | undefined
    let userCity: string | undefined
    let userInterests: string[] | undefined

    try {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, city: true, interests: true },
      })
      if (user) {
        userName = user.name ?? undefined
        userCity = user.city ?? undefined
        userInterests = user.interests.length > 0 ? user.interests : undefined
      }
    } catch (err) {
      console.error("Failed to fetch user for chat context:", err)
    }

    const systemPrompt = buildTripAdvisorPrompt({
      userName,
      userCity,
      userInterests,
      currentPage: context?.page,
      eventDetails,
    })

    // Build message history
    const messages: { role: "user" | "assistant"; content: string }[] = []
    if (context?.history?.length) {
      for (const msg of context.history) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content })
        }
      }
    }
    messages.push({ role: "user", content: message })

    const client = getAnthropicClient()

    const stream = client.messages.stream({
      model: AI_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ text: event.delta.text })
              controller.enqueue(
                new TextEncoder().encode(`data: ${data}\n\n`)
              )
            }
          }
          controller.enqueue(
            new TextEncoder().encode("data: [DONE]\n\n")
          )
          controller.close()
        } catch (err) {
          console.error("Stream error:", err)
          const errorData = JSON.stringify({ error: "Stream interrupted" })
          controller.enqueue(
            new TextEncoder().encode(`data: ${errorData}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}
