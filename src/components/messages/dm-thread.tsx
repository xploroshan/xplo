"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Msg {
  id: string
  content: string | null
  deleted: boolean
  createdAt: string
  senderId: string
  sender: { id: string; name: string | null; image: string | null }
}

export function DmThread({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastAtRef = useRef<string | null>(null)

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  const load = useCallback(async () => {
    const url = lastAtRef.current
      ? `/api/conversations/${conversationId}/messages?after=${encodeURIComponent(lastAtRef.current)}`
      : `/api/conversations/${conversationId}/messages`
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json()
    setMe(data.me)
    if (data.messages.length > 0) {
      setMessages((prev) => {
        const byId = new Map(prev.map((m: Msg) => [m.id, m]))
        for (const m of data.messages as Msg[]) byId.set(m.id, m)
        return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      })
      lastAtRef.current = (data.messages as Msg[])[data.messages.length - 1].createdAt
      requestAnimationFrame(scrollToBottom)
    }
  }, [conversationId, scrollToBottom])

  useEffect(() => {
    let active = true
    ;(async () => { await load(); if (active) { setLoading(false); requestAnimationFrame(scrollToBottom) } })()
    const t = setInterval(load, 4000)
    return () => { active = false; clearInterval(t) }
  }, [load, scrollToBottom])

  async function send() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }),
      })
      if (res.ok) { setInput(""); await load(); requestAnimationFrame(scrollToBottom) }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-zinc-600" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-sm text-zinc-500">No messages yet — say hello 👋</div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === me
            return (
              <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                <Avatar className="h-7 w-7 shrink-0">
                  {m.sender.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.sender.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-zinc-700 text-zinc-300 text-[10px]">{m.sender.name?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
                  )}
                </Avatar>
                <div className={cn("max-w-[78%] rounded-2xl px-3 py-2 text-sm", mine ? "bg-orange-500/90 text-white" : "bg-zinc-800 text-zinc-100")}>
                  {m.deleted ? <em className="opacity-60">deleted</em> : <span className="whitespace-pre-wrap break-words">{m.content}</span>}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="border-t border-zinc-800/50 bg-zinc-950 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder="Message…"
            className="flex-1 resize-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-orange-500/40 max-h-32"
          />
          <Button variant="glow" size="icon" className="rounded-xl shrink-0" onClick={send} disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
