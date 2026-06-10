"use client"

import { useEffect, useRef } from "react"
import { track } from "@/lib/analytics-client"
import type { ClientAnalyticsName } from "@/lib/analytics-client"

interface TrackViewProps {
  name: Extract<ClientAnalyticsName, "event_viewed" | "organizer_viewed">
  eventId?: string
  organizerId?: string
}

/** Fires a single view event on mount. Drop into a server page to instrument it. */
export function TrackView({ name, eventId, organizerId }: TrackViewProps) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    track(name, { eventId, organizerId })
  }, [name, eventId, organizerId])
  return null
}
