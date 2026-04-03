import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import {
  getAnthropicClient,
  isAIAvailable,
  AI_MODEL,
} from "@/lib/ai"

export async function GET() {
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
      `ai-recommendations:${session.user.id}`,
      10,
      60 * 1000
    )
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", remaining },
        { status: 429 }
      )
    }

    // Fetch user data: interests, city, past events, follows
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        city: true,
        interests: true,
        participations: {
          select: {
            event: {
              select: {
                id: true,
                eventTypeId: true,
                eventType: { select: { name: true } },
              },
            },
          },
          where: { status: "CONFIRMED" },
        },
        following: {
          select: { followingId: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userInterests = user.interests ?? []
    const userCity = user.city ?? ""
    const pastEventTypeIds = user.participations.map(
      (p) => p.event.eventTypeId
    )
    const pastEventTypeNames = user.participations.map(
      (p) => p.event.eventType.name
    )
    const followedOrganizerIds = user.following.map((f) => f.followingId)

    // Fetch upcoming OPEN events
    const upcomingEvents = await db.event.findMany({
      where: {
        status: "OPEN",
        startDate: { gte: new Date() },
      },
      include: {
        eventType: true,
        organizer: {
          select: { id: true, name: true, slug: true, image: true },
        },
        _count: { select: { participants: true } },
      },
      orderBy: { startDate: "asc" },
      take: 50,
    })

    if (upcomingEvents.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    // Score events using rule-based scoring
    const scored = upcomingEvents.map((event) => {
      let score = 0
      const reasons: string[] = []

      // Type match: +30 if event type matches user interests
      if (
        userInterests.some(
          (interest) =>
            event.eventType.name.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(event.eventType.name.toLowerCase())
        )
      ) {
        score += 30
        reasons.push("type_match")
      }

      // City match: +20 if event start location matches user city
      const startLoc = event.startLocation as { address?: string } | null
      const dest = event.destination as { address?: string } | null
      if (
        userCity &&
        (startLoc?.address?.toLowerCase().includes(userCity.toLowerCase()) ||
          dest?.address?.toLowerCase().includes(userCity.toLowerCase()))
      ) {
        score += 20
        reasons.push("city_match")
      }

      // Follow organizer: +25 if user follows the organizer
      if (followedOrganizerIds.includes(event.organizerId)) {
        score += 25
        reasons.push("follows_organizer")
      }

      // Similar past events: +15 if user has done same event type before
      if (pastEventTypeIds.includes(event.eventTypeId)) {
        score += 15
        reasons.push("similar_past")
      }

      return {
        event,
        score,
        reasons,
      }
    })

    // Sort by score descending, take top 6
    scored.sort((a, b) => b.score - a.score)
    const top = scored.slice(0, 6)

    // Build event summaries for Claude to generate explanations
    const eventSummaries = top.map((item, idx) => {
      const e = item.event
      const startLoc = e.startLocation as { address?: string } | null
      const dest = e.destination as { address?: string } | null
      return `${idx + 1}. "${e.title}" (${e.eventType.name}) - ${startLoc?.address || "TBD"} to ${dest?.address || "TBD"} on ${e.startDate.toISOString().split("T")[0]} - Score: ${item.score} (${item.reasons.join(", ")})`
    })

    const client = getAnthropicClient()

    const prompt = `You are a personalized recommendation engine for an outdoor adventure platform in India.

User profile:
- Name: ${user.name || "Anonymous"}
- City: ${userCity || "Not specified"}
- Interests: ${userInterests.length > 0 ? userInterests.join(", ") : "Not specified"}
- Past event types: ${pastEventTypeNames.length > 0 ? Array.from(new Set(pastEventTypeNames)).join(", ") : "None yet"}

Here are the top recommended events for this user (already scored by relevance):
${eventSummaries.join("\n")}

For each event, generate a brief, personalized 1-line explanation (max 15 words) of why this event is recommended for this user. Be specific and reference their interests/location/history when applicable.

Respond with a JSON object (no markdown, just raw JSON):
{
  "explanations": ["explanation for event 1", "explanation for event 2", ...]
}`

    let explanations: string[] = []

    try {
      const response = await client.messages.create({
        model: AI_MODEL,
        max_tokens: 512,
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
        }
      }

      if (parsed?.explanations && Array.isArray(parsed.explanations)) {
        explanations = parsed.explanations
      }
    } catch (err) {
      console.error("Failed to generate AI explanations:", err)
      // Fall back to empty explanations - still return scored results
    }

    const recommendations = top.map((item, idx) => {
      const e = item.event
      const startLoc = e.startLocation as { address?: string } | null
      const dest = e.destination as { address?: string } | null
      return {
        eventId: e.id,
        title: e.title,
        slug: e.slug,
        eventType: e.eventType.name,
        startDate: e.startDate.toISOString(),
        startLocation: startLoc?.address ?? null,
        destination: dest?.address ?? null,
        coverImage: e.coverImage,
        price: e.price ? Number(e.price) : 0,
        capacity: e.capacity,
        participantCount: e._count.participants,
        organizer: e.organizer,
        score: item.score,
        reasons: item.reasons,
        explanation: explanations[idx] || null,
      }
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("AI recommendations error:", error)
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}
