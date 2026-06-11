"use client"

import { useCallback, useEffect, useRef, useState, Fragment } from "react"
import {
  Send, Reply, Pin, PinOff, Trash2, X, Loader2, ImagePlus, BarChart3,
  SmilePlus, Pencil, Search,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRealtime } from "@/hooks/use-realtime"

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "🎉", "🙏"]

interface Reaction { emoji: string; count: number; mine: boolean }
interface PollOption { text: string; votes: number; mine: boolean }
interface Poll { question: string; multi: boolean; options: PollOption[]; totalVoters: number }

interface Msg {
  id: string
  content: string | null
  type: string
  imageUrl: string | null
  mentions: string[]
  reactions: Reaction[]
  poll: Poll | null
  pinned: boolean
  deleted: boolean
  editedAt: string | null
  createdAt: string
  updatedAt: string
  senderId: string
  sender: { id: string; name: string | null; image: string | null }
  replyTo: { id: string; content: string | null; senderName: string | null } | null
}

// Render text with @mentions highlighted.
function renderText(text: string) {
  return text.split(/(@[a-zA-Z0-9_]+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-orange-300 font-medium">{part}</span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

export function EventChat({
  eventId,
  eventTitle,
  realtime = false,
  selfName = "",
}: {
  eventId: string
  eventTitle: string
  realtime?: boolean
  selfName?: string
}) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [pinned, setPinned] = useState<Msg[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [canModerate, setCanModerate] = useState(false)
  const [chatActive, setChatActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [input, setInput] = useState("")
  const [replyTo, setReplyTo] = useState<Msg | null>(null)
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)
  const [reactingId, setReactingId] = useState<string | null>(null)
  const [showPoll, setShowPoll] = useState(false)
  const [search, setSearch] = useState<{ open: boolean; q: string; results: Msg[] }>({ open: false, q: "", results: [] })

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastAtRef = useRef<string | null>(null)
  const atBottomRef = useRef(true)

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  const markRead = useCallback(() => {
    fetch(`/api/events/${eventId}/messages/read`, { method: "POST" }).catch(() => {})
  }, [eventId])

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
    // Only the initial (non-cursor) load reports whether older history exists.
    if (!lastAtRef.current) setHasMore(!!data.hasMore)

    if (data.messages.length > 0) {
      setMessages((prev) => {
        const seen = new Set(prev.map((m: Msg) => m.id))
        const byId = new Map(prev.map((m: Msg) => [m.id, m]))
        for (const m of data.messages as Msg[]) byId.set(m.id, m)
        const merged = Array.from(byId.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        const hasNew = (data.messages as Msg[]).some((m) => !seen.has(m.id))
        if (hasNew && atBottomRef.current) requestAnimationFrame(scrollToBottom)
        return merged
      })
      // Cursor tracks the max updatedAt (covers new + edited/reacted/deleted).
      const maxUpdated = (data.messages as Msg[]).reduce(
        (mx, m) => (m.updatedAt > mx ? m.updatedAt : mx),
        lastAtRef.current ?? ""
      )
      if (maxUpdated) lastAtRef.current = maxUpdated
      markRead()
    }
  }, [eventId, scrollToBottom, markRead])

  // Load a page of older history, prepending it while holding scroll position
  // (so the viewport doesn't jump when content is inserted above).
  const loadOlder = useCallback(async () => {
    const oldest = messages[0]
    if (!oldest || loadingOlder) return
    setLoadingOlder(true)
    const el = scrollRef.current
    const prevHeight = el?.scrollHeight ?? 0
    try {
      const res = await fetch(
        `/api/events/${eventId}/messages?before=${encodeURIComponent(oldest.createdAt)}`
      )
      if (!res.ok) return
      const data = await res.json()
      setHasMore(!!data.hasMore)
      if (data.messages.length > 0) {
        setMessages((prev) => {
          const byId = new Map<string, Msg>((data.messages as Msg[]).map((m) => [m.id, m]))
          for (const m of prev) byId.set(m.id, m)
          return Array.from(byId.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        })
        // Restore the scroll offset after the taller content renders.
        requestAnimationFrame(() => {
          const e2 = scrollRef.current
          if (e2) e2.scrollTop += e2.scrollHeight - prevHeight
        })
      }
    } finally {
      setLoadingOlder(false)
    }
  }, [eventId, messages, loadingOlder])

  // Realtime: instant pokes + typing + presence (falls back to polling alone).
  const { onlineCount, typingNames, sendTyping } = useRealtime({
    enabled: realtime,
    channelName: `event:${eventId}:chat`,
    selfId: me,
    onChange: load,
    presence: true,
  })
  const lastTypingRef = useRef(0)
  function notifyTyping() {
    const now = Date.now()
    if (realtime && selfName && now - lastTypingRef.current > 2000) {
      lastTypingRef.current = now
      sendTyping(selfName)
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      await load()
      if (active) {
        setLoading(false)
        markRead()
        requestAnimationFrame(scrollToBottom)
      }
    })()
    // With realtime on, polling is just a safety net; otherwise it's the driver.
    const t = setInterval(load, realtime ? 15000 : 4000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [load, scrollToBottom, markRead, realtime])

  // Replace a single message in state from an API response (react/vote/edit).
  function patchMsg(updated: Msg) {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
  }

  async function sendMessage(payload: { content?: string; imageUrl?: string; poll?: { question: string; options: string[]; multi?: boolean } }) {
    setSending(true)
    try {
      const res = await fetch(`/api/events/${eventId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, replyToId: replyTo?.id }),
      })
      if (res.ok) {
        setInput("")
        setReplyTo(null)
        setShowPoll(false)
        await load()
        requestAnimationFrame(scrollToBottom)
      }
    } finally {
      setSending(false)
    }
  }

  async function attachImage(file: File) {
    const body = new FormData()
    body.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body })
    const data = await res.json()
    if (res.ok) await sendMessage({ imageUrl: data.url, content: input.trim() || undefined })
  }

  async function react(m: Msg, emoji: string) {
    setReactingId(null)
    const res = await fetch(`/api/events/${eventId}/messages/${m.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    })
    if (res.ok) patchMsg((await res.json()).message)
  }

  async function vote(m: Msg, option: number) {
    const res = await fetch(`/api/events/${eventId}/messages/${m.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option }),
    })
    if (res.ok) patchMsg((await res.json()).message)
  }

  async function saveEdit() {
    if (!editing) return
    const res = await fetch(`/api/events/${eventId}/messages/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editing.text }),
    })
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === editing.id ? { ...m, content: editing.text, editedAt: new Date().toISOString() } : m)))
    }
    setEditing(null)
  }

  async function togglePin(m: Msg) {
    await fetch(`/api/events/${eventId}/messages/${m.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !m.pinned }),
    })
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, pinned: !m.pinned } : x)))
    load()
  }

  async function remove(m: Msg) {
    await fetch(`/api/events/${eventId}/messages/${m.id}`, { method: "DELETE" })
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deleted: true, content: null, imageUrl: null, poll: null } : x)))
  }

  async function runSearch(q: string) {
    setSearch((s) => ({ ...s, q }))
    if (!q.trim()) return setSearch((s) => ({ ...s, results: [] }))
    const res = await fetch(`/api/events/${eventId}/messages?q=${encodeURIComponent(q)}`)
    if (!res.ok) return
    const data = await res.json()
    setSearch((s) => ({ ...s, results: data.results }))
  }

  const editable = (m: Msg) =>
    m.senderId === me && !m.deleted && m.type !== "POLL" && Date.now() - new Date(m.createdAt).getTime() < 15 * 60 * 1000

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Pinned + search toggle */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50">
        {pinned.length > 0 && (
          <div className="px-4 py-2 space-y-1">
            {pinned.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs text-zinc-400">
                <Pin className="h-3 w-3 text-orange-400 shrink-0" />
                <span className="font-medium text-zinc-300">{p.sender.name}:</span>
                <span className="truncate">{p.content ?? (p.imageUrl ? "📷 photo" : p.poll ? "📊 poll" : "")}</span>
              </div>
            ))}
          </div>
        )}
        <div className="px-3 py-2">
          {search.open ? (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                autoFocus
                value={search.q}
                onChange={(e) => runSearch(e.target.value)}
                placeholder="Search this chat…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              <button onClick={() => setSearch({ open: false, q: "", results: [] })} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearch((s) => ({ ...s, open: true }))} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300">
              <Search className="h-3.5 w-3.5" /> Search messages
            </button>
          )}
        </div>
      </div>

      {/* Search results overlay */}
      {search.open && search.q.trim() ? (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {search.results.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-8">No matches.</p>
          ) : (
            search.results.map((m) => (
              <div key={m.id} className="rounded-lg bg-zinc-900/50 p-3">
                <p className="text-xs text-zinc-500 mb-0.5">{m.sender.name} · {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                <p className="text-sm text-zinc-200">{m.content}</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget
            atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
          }}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
          {!loading && hasMore && messages.length > 0 && (
            <div className="flex justify-center pb-1">
              <button
                onClick={loadOlder}
                disabled={loadingOlder}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
              >
                {loadingOlder ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Load older messages
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-zinc-600" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-sm text-zinc-500">No messages yet. Say hi to the group for {eventTitle}! 👋</div>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === me
              const initials = m.sender.name?.charAt(0).toUpperCase() ?? "?"
              return (
                <div key={m.id} className={cn("flex gap-2 group", mine && "flex-row-reverse")}>
                  <Avatar className="h-7 w-7 shrink-0">
                    {m.sender.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.sender.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-zinc-700 text-zinc-300 text-[10px]">{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className={cn("max-w-[78%] min-w-0", mine && "items-end flex flex-col")}>
                    {!mine && <p className="text-[11px] text-zinc-500 mb-0.5 px-1">{m.sender.name}</p>}
                    <div className={cn("rounded-2xl px-3 py-2 text-sm", mine ? "bg-orange-500/90 text-white" : "bg-zinc-800 text-zinc-100", m.pinned && "ring-1 ring-orange-400/50")}>
                      {m.replyTo && (
                        <div className="mb-1 border-l-2 border-white/30 pl-2 text-xs opacity-80">
                          <span className="font-medium">{m.replyTo.senderName}</span>: {m.replyTo.content ?? <em>deleted</em>}
                        </div>
                      )}

                      {m.deleted ? (
                        <em className="opacity-60">message deleted</em>
                      ) : editing?.id === m.id ? (
                        <div className="flex items-center gap-1">
                          <Input value={editing.text} onChange={(e) => setEditing({ id: m.id, text: e.target.value })} onKeyDown={(e) => e.key === "Enter" && saveEdit()} className="h-7 bg-black/20 border-white/20 text-white text-sm" />
                          <button onClick={saveEdit} className="text-white/80 hover:text-white"><Send className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setEditing(null)} className="text-white/80 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ) : (
                        <>
                          {m.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.imageUrl} alt="" className="rounded-lg max-h-64 mb-1 object-cover" />
                          )}
                          {m.poll && (
                            <div className="space-y-1.5 min-w-[220px]">
                              <p className="font-medium mb-1">📊 {m.poll.question}</p>
                              {m.poll.options.map((opt, i) => {
                                const pct = m.poll!.totalVoters > 0 ? Math.round((opt.votes / m.poll!.totalVoters) * 100) : 0
                                return (
                                  <button key={i} onClick={() => vote(m, i)} className="relative block w-full text-left rounded-lg overflow-hidden border border-white/20 px-2 py-1 text-xs">
                                    <span className="absolute inset-0 bg-white/15" style={{ width: `${pct}%` }} />
                                    <span className="relative flex justify-between">
                                      <span>{opt.mine ? "✓ " : ""}{opt.text}</span>
                                      <span className="opacity-80">{pct}%</span>
                                    </span>
                                  </button>
                                )
                              })}
                              <p className="text-[10px] opacity-70">{m.poll.totalVoters} vote{m.poll.totalVoters === 1 ? "" : "s"}{m.poll.multi ? " · multi" : ""}</p>
                            </div>
                          )}
                          {m.content && m.type !== "POLL" && <span className="whitespace-pre-wrap break-words">{renderText(m.content)}</span>}
                          {m.editedAt && <span className="text-[10px] opacity-60 ml-1">(edited)</span>}
                        </>
                      )}
                    </div>

                    {/* Reactions */}
                    {m.reactions.length > 0 && (
                      <div className={cn("flex gap-1 mt-1", mine && "justify-end")}>
                        {m.reactions.map((r) => (
                          <button key={r.emoji} onClick={() => react(m, r.emoji)} className={cn("rounded-full px-1.5 py-0.5 text-xs border", r.mine ? "bg-orange-500/20 border-orange-500/40" : "bg-zinc-800 border-zinc-700")}>
                            {r.emoji} {r.count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover actions */}
                  {!m.deleted && (
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 self-center">
                      <button onClick={() => setReactingId(reactingId === m.id ? null : m.id)} title="React" className="p-1 text-zinc-500 hover:text-amber-400"><SmilePlus className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setReplyTo(m)} title="Reply" className="p-1 text-zinc-500 hover:text-white"><Reply className="h-3.5 w-3.5" /></button>
                      {editable(m) && <button onClick={() => setEditing({ id: m.id, text: m.content ?? "" })} title="Edit" className="p-1 text-zinc-500 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>}
                      {canModerate && <button onClick={() => togglePin(m)} title={m.pinned ? "Unpin" : "Pin"} className="p-1 text-zinc-500 hover:text-orange-400">{m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}</button>}
                      {(mine || canModerate) && <button onClick={() => remove(m)} title="Delete" className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>}
                      {reactingId === m.id && (
                        <div className="absolute -top-9 right-0 z-10 flex gap-0.5 rounded-full bg-zinc-900 border border-zinc-700 px-1.5 py-1 shadow-xl">
                          {QUICK_REACTIONS.map((e) => (
                            <button key={e} onClick={() => react(m, e)} className="text-base hover:scale-125 transition-transform">{e}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Live status: typing + presence */}
      {realtime && (typingNames.length > 0 || onlineCount > 1) && (
        <div className="px-4 py-1 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="text-orange-400/90">
            {typingNames.length > 0
              ? `${typingNames.slice(0, 2).join(", ")}${typingNames.length > 2 ? " +" : ""} typing…`
              : ""}
          </span>
          {onlineCount > 1 && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {onlineCount} online
            </span>
          )}
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-zinc-800/50 bg-zinc-950 p-3">
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400 bg-zinc-900 rounded-lg px-3 py-1.5">
            <Reply className="h-3.5 w-3.5" /> Replying to <span className="font-medium text-zinc-300">{replyTo.sender.name}</span>
            <button onClick={() => setReplyTo(null)} className="ml-auto text-zinc-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {showPoll && <PollComposer onCancel={() => setShowPoll(false)} onCreate={(poll) => sendMessage({ poll })} sending={sending} />}

        {chatActive ? (
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) attachImage(f); e.target.value = "" }} />
            <button onClick={() => fileRef.current?.click()} title="Photo" className="h-10 w-10 shrink-0 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center"><ImagePlus className="h-5 w-5" /></button>
            <button onClick={() => setShowPoll((s) => !s)} title="Poll" className="h-10 w-10 shrink-0 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center"><BarChart3 className="h-5 w-5" /></button>
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); notifyTyping() }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim()) sendMessage({ content: input.trim() }) } }}
              rows={1}
              placeholder="Message the group…  @name to mention"
              className="flex-1 resize-none rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-orange-500/40 max-h-32"
            />
            <Button variant="glow" size="icon" className="rounded-xl shrink-0" onClick={() => input.trim() && sendMessage({ content: input.trim() })} disabled={sending || !input.trim()}>
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

function PollComposer({ onCancel, onCreate, sending }: { onCancel: () => void; onCreate: (poll: { question: string; options: string[]; multi?: boolean }) => void; sending: boolean }) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [multi, setMulti] = useState(false)

  const valid = question.trim() && options.filter((o) => o.trim()).length >= 2

  return (
    <div className="mb-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 space-y-2">
      <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask the group…" className="bg-zinc-800/50 border-zinc-700" />
      {options.map((o, i) => (
        <Input key={i} value={o} onChange={(e) => setOptions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Option ${i + 1}`} className="bg-zinc-800/50 border-zinc-700 h-9" />
      ))}
      <div className="flex items-center gap-2">
        {options.length < 6 && <button onClick={() => setOptions((p) => [...p, ""])} className="text-xs text-orange-400">+ Add option</button>}
        <label className="flex items-center gap-1.5 text-xs text-zinc-400 ml-auto">
          <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} className="rounded border-zinc-700 bg-zinc-900" /> Allow multiple
        </label>
      </div>
      <div className="flex gap-2">
        <Button variant="glow" size="sm" disabled={!valid || sending} onClick={() => onCreate({ question: question.trim(), options: options.map((o) => o.trim()).filter(Boolean), multi })}>Post poll</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
