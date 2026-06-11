"use client"

import * as Ably from "ably"

/**
 * A single Ably connection shared across every chat surface in the tab.
 *
 * Previously each useRealtime instance — and every channelName/selfId change —
 * constructed its own Ably.Realtime, opening a fresh WebSocket each time. That
 * burns connections (Ably bills on peak concurrency) and slows channel
 * switches. Here we keep one client alive while at least one subscriber needs
 * it, reference-counted so it closes cleanly when the last one leaves.
 */
let client: Ably.Realtime | null = null
let refs = 0
let pendingClose: ReturnType<typeof setTimeout> | null = null

export function acquireRealtimeClient(): Ably.Realtime {
  // A release scheduled a close but we're back before it fired — cancel it and
  // reuse the live connection instead of churning a new WebSocket.
  if (pendingClose) {
    clearTimeout(pendingClose)
    pendingClose = null
  }
  if (!client) {
    // echoMessages:false → we never receive our own pokes/typing.
    client = new Ably.Realtime({ authUrl: "/api/realtime/token", echoMessages: false })
  }
  refs += 1
  return client
}

export function releaseRealtimeClient() {
  refs = Math.max(0, refs - 1)
  if (refs > 0 || pendingClose) return
  // Defer the close: a navigation often unmounts one surface and mounts the
  // next within the same tick, so give a re-acquire a chance before tearing
  // the connection down.
  pendingClose = setTimeout(() => {
    pendingClose = null
    if (refs === 0 && client) {
      client.close()
      client = null
    }
  }, 250)
}
