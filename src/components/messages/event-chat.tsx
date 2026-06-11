"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Send, Reply, Pin, PinOff, Trash2, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Msg {
  id: string
  content: string | null
  type: string
  pinned: boolean
  deleted: boolean
  editedAt: string | null
  createdAt: string
  senderId: string
  sender: { id: string; name: string | null; image: string | null }
  replyTo: { id: string; content: string | null; senderName: string | null } | null
}

const POLL_MS = 4000

export function EventChat({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [pinned, setPinned] = useState<Msg[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [canModerate, setCanModerate] = useState(false)
  const [chatActive, setChatActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [replyTo, setReplyTo] = useState<Msg | null>(null)
  const [sending, setSending] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const lastAtRef = useRef<string | null>(null)
  const atBottomRef = useRef(true)

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  const load = useCallback(async () => {
    const url = lastAtRef.current
      ? `/api/events/${eventId}/messages?after=${encodeURIComponent(lastAtRef.current)}`
      : `/api/events/${eventId}/messages`
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json()
    setMe(data.me)
    setCanModerate(data.canModerate)
    setChatActive(data.chatActive)
    setPinned(data.pinned)

    if (data.messages.length > 0) {
      setMessages((prev) => {
        const seen = new Set(prev.map((m: Msg) => m.id))
        // Merge: replace existing (pin/delete updates) + append new.
        const byId = new Map(prev.map((m: Msg) => [m.id, m]))
        for (const m of data.messages as Msg[]) byId.set(m.id, m)
        const merged = Array.from(byId.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        const hasNew = (data.messages as Msg[]).some((m) => !seen.has(m.id))
        if (hasNew && atBottomRef.current) requestAnimationFrame(scrollToBottom)
        return merged
      })
      const newest = (data.messages as Msg[])[data.messages.length - 1]
      if (newest) lastAtRef.current = newest.createdAt
    }
  }, [eventId, scrollToBottom])

  // Initial load + polling.
  useEffect(() => {
    let active = true
    ;(async () => {
      await load()
      if (active) {
        setLoading(false)
        requestAnimationFrame(scrollToBottom)
      }
    })()
    const t = setInterval(load, POLL_MS)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [load, scrollToBottom])

  async function send() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/events/${eventId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, replyToId: replyTo?.id }),
      })
      if (res.ok) {
        setInput("")
        setReplyTo(null)
        await load()
        requestAnimationFrame(scrollToBottom)
      }
    } finally {
      setSending(false)
    }
  }

  async function togglePin(m: Msg) {
    await fetch(`/api/events/${eventId}/messages/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !m.pinned }),
    })
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, pinned: !m.pinned } : x)))
    load()
  }

  async function remove(m: Msg) {
    await fetch(`/api/events/${eventId}/messages/${m.id}`, { method: "DELETE" })
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deleted: true, content: null } : x)))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Pinned bar */}
      {pinned.length > 0 && (
        <div className="border-b border-zinc-800/50 bg-zinc-900/50 px-4 py-2 space-y-1">
          {pinned.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-xs text-zinc-400">
              <Pin className="h-3 w-3 text-orange-400 shrink-0" />
              <span className="font-medium text-zinc-300">{p.sender.name}:</span>
              <span className="truncate">{p.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-sm text-zinc-500">
            No messages yet. Say hi to the group for {eventTitle}! 👋
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === me
            const initials = m.sender.name?.charAt(0).toUpperCase() ?? "?"
            return (
              <div key={m.id} className={cn("flex gap-2 group", mine && "flex-row-reverse")}>
                <Avatar className="h-7 w-7 shrink-0">
                  {m.sender.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.sender.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-zinc-700 text-zinc-300 text-[10px]">{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className={cn("max-w-[75%]", mine && "items-end flex flex-col")}>
                  {!mine && <p className="text-[11px] text-zinc-500 mb-0.5 px-1">{m.sender.name}</p>}
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm",
                      mine ? "bg-orange-500/90 text-white" : "bg-zinc-800 text-zinc-100",
                      m.pinned && "ring-1 ring-orange-400/50"
                    )}
                  >
                    {m.replyTo && (
                      <div className="mb-1 border-l-2 border-white/30 pl-2 text-xs opacity-80">
                        <span className="font-medium">{m.replyTo.senderName}</span>:{" "}
                        {m.replyTo.content ?? <em>deleted</em>}
                      </div>
                    )}
                    {m.deleted ? (
                      <em className="opacity-60">message deleted</em>
                    ) : (
                      <span className="whitespace-pre-wrap break-words">{m.content}</span>
                    )}
                  </div>
                </div>

                {/* Hover actions */}
                {!m.deleted && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 self-center">
                    <button onClick={() => setReplyTo(m)} title="Reply" className="p-1 text-zinc-500 hover:text-white">
                      <Reply className="h-3.5 w-3.5" />
                    </button>
                    {canModerate && (
                      <button onClick={() => togglePin(m)} title={m.pinned ? "Unpin" : "Pin"} className="p-1 text-zinc-500 hover:text-orange-400">
                        {m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {(mine || canModerate) && (
                      <button onClick={() => remove(m)} title="Delete" className="p-1 text-zinc-500 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-zinc-800/50 bg-zinc-950 p-3">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400 bg-zinc-900 rounded-lg px-3 py-1.5">
            <Reply className="h-3.5 w-3.5" />
            Replying to <span className="font-medium text-zinc-300">{replyTo.sender.name}</span>
            <button onClick={() => setReplyTo(null)} className="ml-auto text-zinc-500 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {chatActive ? (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder="Message the group…"
              className="flex-1 resize-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-orange-500/40 max-h-32"
            />
            <Button variant="glow" size="icon" className="rounded-xl shrink-0" onClick={send} disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <p className="text-center text-xs text-zinc-500 py-2">This chat is now read-only.</p>
        )}
      </div>
    </div>
  )
}
