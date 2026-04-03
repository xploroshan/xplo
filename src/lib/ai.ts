import Anthropic from "@anthropic-ai/sdk"

// Singleton Anthropic client
let client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set in environment variables")
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

// Check if AI features are available
export function isAIAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

// Standard model for all AI features
export const AI_MODEL = "claude-sonnet-4-20250514"

// Build system prompt for the Trip Advisor chat
export function buildTripAdvisorPrompt(context: {
  userName?: string
  userCity?: string
  userInterests?: string[]
  currentPage?: string
  eventDetails?: {
    title: string
    type: string
    description?: string
    startLocation?: string
    destination?: string
    startDate?: string
  }
  kbContext?: string
}): string {
  const parts: string[] = [
    `You are HYKRZ Trip Advisor — an expert on outdoor adventures in India.
You help users with: event preparation, safety, gear recommendations,
fitness advice, route information, weather guidance, and destination tips.

Guidelines:
- Be concise and practical (2-4 paragraphs max)
- Prioritize safety above all else
- Reference specific gear brands available in India when relevant
- Suggest realistic preparation timelines
- Use INR (₹) for prices
- If unsure about specific details, say so rather than guess`,
  ]

  if (context.userName || context.userCity || context.userInterests?.length) {
    parts.push(
      `\nUser: ${context.userName || "Anonymous"}${context.userCity ? `, based in ${context.userCity}` : ""}${context.userInterests?.length ? `, interests: ${context.userInterests.join(", ")}` : ""}`
    )
  }

  if (context.currentPage) {
    parts.push(`\nCurrent page: ${context.currentPage}`)
  }

  if (context.eventDetails) {
    const e = context.eventDetails
    parts.push(
      `\nEvent context:
- Title: ${e.title}
- Type: ${e.type}${e.description ? `\n- Description: ${e.description.slice(0, 500)}` : ""}${e.startLocation ? `\n- Start: ${e.startLocation}` : ""}${e.destination ? `\n- Destination: ${e.destination}` : ""}${e.startDate ? `\n- Date: ${e.startDate}` : ""}`
    )
  }

  if (context.kbContext) {
    parts.push(`\nReference knowledge:\n${context.kbContext}`)
  }

  return parts.join("\n")
}

// Build prompt for event enhancement
export function buildEventEnhancePrompt(event: {
  title: string
  eventType: string
  startLocation?: string
  destination?: string
  startDate?: string
  endDate?: string
  capacity?: number
  price?: number
}): string {
  return `You are an expert event organizer for outdoor adventures in India.
Given the following event details, generate comprehensive content to help the organizer create a professional listing.

Event:
- Title: ${event.title}
- Type: ${event.eventType}
${event.startLocation ? `- Starting Point: ${event.startLocation}` : ""}
${event.destination ? `- Destination: ${event.destination}` : ""}
${event.startDate ? `- Start Date: ${event.startDate}` : ""}
${event.endDate ? `- End Date: ${event.endDate}` : ""}
${event.capacity ? `- Capacity: ${event.capacity} participants` : ""}
${event.price ? `- Price: ₹${event.price}` : "- Price: Free"}

Respond with a JSON object (no markdown, just raw JSON) containing:
{
  "description": "A rich 300-500 word event description that excites participants and sets clear expectations",
  "difficulty": "beginner" | "intermediate" | "advanced" | "expert",
  "estimatedDuration": "Estimated total duration (e.g., '6-8 hours')",
  "equipmentChecklist": ["Array of required equipment items with specifics"],
  "safetyGuidelines": ["Array of safety rules specific to this event type and route"],
  "itinerary": [{"time": "06:00 AM", "activity": "Assembly at starting point"}],
  "weatherAdvisory": "Season-specific weather advice for this location",
  "fitnessRequirements": "Clear description of fitness level needed"
}`
}

// Build prompt for difficulty assessment
export function buildAssessmentPrompt(event: {
  title: string
  type: string
  description?: string
  startLocation?: string
  destination?: string
}): string {
  return `You are a safety expert for outdoor adventures. Assess the following event's difficulty and safety considerations.

Event:
- Title: ${event.title}
- Type: ${event.type}
${event.description ? `- Description: ${event.description.slice(0, 1000)}` : ""}
${event.startLocation ? `- Start: ${event.startLocation}` : ""}
${event.destination ? `- Destination: ${event.destination}` : ""}

Respond with a JSON object (no markdown, just raw JSON):
{
  "difficulty": {"level": "beginner|intermediate|advanced|expert", "score": 1-10, "reasoning": "Brief explanation"},
  "risks": ["Array of specific risks"],
  "requiredFitness": "Description of fitness requirements",
  "requiredEquipment": ["Array of required equipment"],
  "weatherConsiderations": "Weather-related advice",
  "suitableFor": ["Array of suitable participant descriptions"]
}`
}

// Build prompt for places of interest
export function buildPOIPrompt(event: {
  destination: string
  eventType: string
  startLocation?: string
}): string {
  return `You are a local travel guide expert in India. List 8-12 notable places of interest near the destination for participants of this event.

Event type: ${event.eventType}
Destination: ${event.destination}
${event.startLocation ? `Starting from: ${event.startLocation}` : ""}

Focus on places relevant to ${event.eventType} participants. Include a mix of:
- Must-see attractions and viewpoints
- Food and refreshment stops
- Rest areas and facilities
- Historical or cultural sites
- Natural landmarks

Respond with a JSON object (no markdown, just raw JSON):
{
  "places": [
    {
      "name": "Place name",
      "type": "viewpoint|temple|waterfall|lake|food|fuel|cafe|historical|trail|beach|park|campsite",
      "description": "2-3 sentence description with practical tips",
      "distanceFromDest": "X km from destination",
      "highlights": ["Best feature 1", "Best feature 2"],
      "icon": "Lucide icon name: MapPin|Mountain|Coffee|Fuel|Camera|Trees|Waves|Landmark|Church|UtensilsCrossed|Tent|Eye"
    }
  ]
}`
}

// Build prompt for accommodations
export function buildAccommodationPrompt(event: {
  destination: string
  startDate: string
  eventType: string
}): string {
  const checkIn = event.startDate.split("T")[0]
  return `You are a travel accommodation expert in India. Recommend 9-12 real accommodations near the destination, organized by budget tier.

Destination: ${event.destination}
Event type: ${event.eventType}
Check-in date: ${checkIn}

Include 3-4 options per tier:
- Budget (₹500-1,500/night): Hostels, basic homestays, dormitories
- Mid-range (₹1,500-4,000/night): Comfortable hotels, nice homestays
- Premium (₹4,000+/night): Resorts, luxury stays, boutique hotels

Respond with a JSON object (no markdown, just raw JSON):
{
  "accommodations": [
    {
      "name": "Accommodation name (use real or realistic names for the area)",
      "type": "homestay|hotel|resort|hostel|campsite|guesthouse",
      "priceRange": "₹X - ₹Y/night",
      "budgetTier": "budget|mid-range|premium",
      "rating": "4.2/5",
      "description": "Brief description with key selling points",
      "amenities": ["WiFi", "Parking", "Hot Water"],
      "distanceFromEvent": "X km from starting point"
    }
  ]
}`
}

// Build prompt for event summary
export function buildEventSummaryPrompt(event: {
  title: string
  type: string
  participantCount: number
  completedCount: number
  avgRating: number
  description?: string
}): string {
  return `Generate a brief post-event summary for this completed outdoor adventure.

Event: ${event.title}
Type: ${event.type}
Participants: ${event.participantCount} registered, ${event.completedCount} completed
Average rating: ${event.avgRating}/5
${event.description ? `Description: ${event.description.slice(0, 500)}` : ""}

Respond with a JSON object (no markdown, just raw JSON):
{
  "summary": "2-3 sentence engaging summary of the event",
  "highlights": ["3-4 highlight moments or achievements"],
  "organizerInsights": "2-3 practical suggestions for the organizer's next event"
}`
}

// Helper to generate booking links
export function generateBookingLinks(
  hotelName: string,
  destination: string,
  checkIn: string
): {
  makemytrip: string
  agoda: string
  booking: string
  googleMaps: string
} {
  const encodedDest = encodeURIComponent(destination)
  const encodedHotel = encodeURIComponent(hotelName)
  const encodedSearch = encodeURIComponent(`${hotelName} ${destination}`)

  return {
    makemytrip: `https://www.makemytrip.com/hotels/hotel-listing?city=${encodedDest}&checkin=${checkIn}`,
    agoda: `https://www.agoda.com/search?city=${encodedDest}&checkIn=${checkIn}&los=1`,
    booking: `https://www.booking.com/searchresults.html?ss=${encodedSearch}&checkin=${checkIn}`,
    googleMaps: `https://www.google.com/maps/search/${encodedHotel}+${encodedDest}`,
  }
}
