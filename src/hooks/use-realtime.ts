"use client"

import { useEffect, useRef, useState } from "react"
import * as Ably from "ably"

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
    let client: Ably.Realtime | null = null
    let cancelled = false

    // echoMessages:false → we never receive our own pokes/typing.
    client = new Ably.Realtime({ authUrl: "/api/realtime/token", echoMessages: false })
    const channel = client.channels.get(channelName)
    channelRef.current = channel

    channel.subscribe("change", () => onChangeRef.current?.())

    channel.subscribe("typing", (msg: Ably.InboundMessage) => {
      const name = (msg.data as { name?: string } | undefined)?.name
      if (!name || msg.clientId === selfId) return
      setTypingNames((prev) => (prev.includes(name) ? prev : [...prev, name]))
      clearTimeout(typingTimers.current[name])
      typingTimers.current[name] = setTimeout(
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
      Object.values(typingTimers.current).forEach(clearTimeout)
      try {
        channel.presence.leave()
      } catch {
        /* ignore */
      }
      client?.close()
      channelRef.current = null
    }
  }, [enabled, channelName, selfId, presence])

  function sendTyping(name: string) {
    channelRef.current?.publish("typing", { name }).catch(() => {})
  }

  return { onlineCount, typingNames, sendTyping }
}
