import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { buildIcs } from "@/lib/ics"
import { appUrl } from "@/lib/email"

function addressOf(json: unknown): string | null {
  if (json && typeof json === "object" && "address" in json) {
    const a = (json as { address?: unknown }).address
    return typeof a === "string" ? a : null
  }
  return null
}

// Public .ics download for an event ("Add to calendar" on the event page).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      startDate: true,
      endDate: true,
      status: true,
      startLocation: true,
      destination: true,
    },
  })

  // Don't leak drafts/archived events through the calendar endpoint.
  if (!event || ["DRAFT", "ARCHIVED"].includes(event.status)) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const ics = buildIcs({
    id: event.id,
    title: event.title,
    description: event.description,
    start: event.startDate,
    end: event.endDate,
    location: addressOf(event.destination) ?? addressOf(event.startLocation),
    url: `${appUrl()}/events/${event.slug}`,
  })

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  })
}
