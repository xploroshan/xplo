import Ably from "ably"

// Server-side Ably (REST) publisher. Activates only when ABLY_API_KEY is set —
// otherwise every call is a no-op and the app falls back to polling.
let rest: Ably.Rest | null = null

export function realtimeEnabled(): boolean {
  return !!process.env.ABLY_API_KEY
}

function client(): Ably.Rest | null {
  if (!process.env.ABLY_API_KEY) return null
  if (!rest) rest = new Ably.Rest(process.env.ABLY_API_KEY)
  return rest
}

export const eventChatChannel = (eventId: string) => `event:${eventId}:chat`
export const conversationChannel = (id: string) => `conversation:${id}`
export const eventTrackChannel = (eventId: string) => `event:${eventId}:track`

export interface LivePosition {
  userId: string
  name: string | null
  role: string
  lat: number
  lng: number
  speedKmh?: number | null
  at: string
}

/** Publish a rider's live position (full payload — watchers update markers directly). */
export async function publishLocation(eventId: string, pos: LivePosition): Promise<void> {
  const c = client()
  if (!c) return
  try {
    await c.channels.get(eventTrackChannel(eventId)).publish("loc", pos)
  } catch (err) {
    console.error("ably location publish failed:", err)
  }
}

/**
 * Publish a lightweight "something changed" poke to a channel. Clients react by
 * fetching the delta — keeps per-viewer message presentation correct and the
 * payload tiny. Never throws (realtime is best-effort).
 */
export async function publishChange(channel: string, kind = "update"): Promise<void> {
  const c = client()
  if (!c) return
  try {
    await c.channels.get(channel).publish("change", { kind })
  } catch (err) {
    console.error("ably publish failed:", err)
  }
}
