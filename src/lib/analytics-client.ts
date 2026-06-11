// Browser-side analytics. Server-only events (published/registered/followed) are
// emitted from their own API routes; the public /api/track endpoint only accepts
// the names below, so clients can't forge funnel-critical events.
export const CLIENT_ANALYTICS_NAMES = [
  "event_viewed",
  "organizer_viewed",
  "share_clicked",
  "link_copied",
] as const
export type ClientAnalyticsName = (typeof CLIENT_ANALYTICS_NAMES)[number]

interface ClientTrackData {
  eventId?: string
  organizerId?: string
  props?: Record<string, unknown>
}

/** Fire-and-forget client tracking. Uses sendBeacon so it survives navigation. */
export function track(name: ClientAnalyticsName, data: ClientTrackData = {}): void {
  if (typeof navigator === "undefined") return
  try {
    const body = JSON.stringify({ name, ...data })
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }))
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // never load-bearing
  }
}
