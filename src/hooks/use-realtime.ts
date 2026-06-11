"use client"

import { useEffect, useRef, useState } from "react"
import * as Ably from "ably"
import { acquireRealtimeClient, releaseRealtimeClient } from "@/lib/realtime-client"

interface Options {
  enabled: boolean
  channelName: string
  selfId?: string | null
  onChange?: () => void
  presence?: boolean
}

/**
 * Subscribes to an Ably channel for a chat surface. Receives "change" pokes
 * (caller refetches the delta), broadcasts/receives typing, and tracks presence.
 * A no-op when `enabled` is false (the app then runs on polling alone).
 */
export function useRealtime({ enabled, channelName, selfId, onChange, presence }: Options) {
  const [onlineCount, setOnlineCount] = useState(0)
  const [typingNames, setTypingNames] = useState<string[]>([])
  const channelRef = useRef<Ably.RealtimeChannel | null>(null)
  const onChangeRef = useRef(onChange)
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const timers = typingTimers.current

    // Reuse the tab-wide shared connection; just attach to our channel here.
    const client = acquireRealtimeClient()
    const channel = client.channels.get(channelName)
    channelRef.current = channel

    channel.subscribe("change", () => onChangeRef.current?.())

    channel.subscribe("typing", (msg: Ably.InboundMessage) => {
      const name = (msg.data as { name?: string } | undefined)?.name
      if (!name || msg.clientId === selfId) return
      setTypingNames((prev) => (prev.includes(name) ? prev : [...prev, name]))
      clearTimeout(timers[name])
      timers[name] = setTimeout(
        () => setTypingNames((prev) => prev.filter((n) => n !== name)),
        3500
      )
    })

    if (presence) {
      const refresh = async () => {
        try {
          const members = await channel.presence.get()
          if (!cancelled) setOnlineCount(new Set(members.map((m) => m.clientId)).size)
        } catch {
          /* ignore */
        }
      }
      channel.presence.subscribe(refresh)
      channel.presence.enter().then(refresh).catch(() => {})
    }

    return () => {
      cancelled = true
      Object.values(timers).forEach(clearTimeout)
      try {
        if (presence) channel.presence.leave()
      } catch {
        /* ignore */
      }
      // Detach this channel but leave the shared connection up for others.
      channel.unsubscribe()
      channel.detach()
      channelRef.current = null
      releaseRealtimeClient()
    }
  }, [enabled, channelName, selfId, presence])

  function sendTyping(name: string) {
    channelRef.current?.publish("typing", { name }).catch(() => {})
  }

  return { onlineCount, typingNames, sendTyping }
}
