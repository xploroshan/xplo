import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { track } from "@/lib/analytics"
import { CLIENT_ANALYTICS_NAMES, type ClientAnalyticsName } from "@/lib/analytics-client"

// Public endpoint for browser-emitted analytics (views, shares). Only the
// client-safe names are accepted; the actor is taken from the session, never
// the body. Always returns 204 so tracking can never surface an error to users.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      name?: string
      eventId?: string
      organizerId?: string
      props?: Record<string, unknown>
    } | null

    if (!body?.name || !CLIENT_ANALYTICS_NAMES.includes(body.name as ClientAnalyticsName)) {
      return new NextResponse(null, { status: 204 })
    }

    const session = await auth()
    await track(body.name as ClientAnalyticsName, {
      userId: session?.user?.id,
      eventId: typeof body.eventId === "string" ? body.eventId : undefined,
      organizerId: typeof body.organizerId === "string" ? body.organizerId : undefined,
      props: body.props && typeof body.props === "object" ? body.props : undefined,
    })
  } catch {
    // swallow — analytics is never load-bearing
  }
  return new NextResponse(null, { status: 204 })
}
