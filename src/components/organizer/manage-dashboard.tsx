"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Users, Pencil, Megaphone, Check, X, ArrowUp, Loader2, Ticket, Trash2, IndianRupee } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/image-upload"
import { cn } from "@/lib/utils"

type Status = "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED"
type Role = "MEMBER" | "PILOT" | "SWEEP" | "MODERATOR"

interface Participant {
  id: string
  status: Status
  role: Role
  joinedAt: string
  checkedInAt: string | null
  user: { id: string; name: string | null; image: string | null; slug: string | null; city: string | null }
}

interface EventData {
  id: string
  slug: string
  title: string
  description: string
  startDate: string
  endDate: string
  capacity: number | null
  price: number | null
  status: string
  requiresApproval: boolean
  coverImage: string | null
  startLocationAddress: string
  destinationAddress: string
  assemblyPointAddress: string
  assemblyPointTime: string
  checklist: string[]
}

const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "OPEN", "CLOSED", "ACTIVE", "COMPLETED", "ARCHIVED"]
const ROLES: Role[] = ["MEMBER", "PILOT", "SWEEP", "MODERATOR"]

function toLocalInput(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function ManageDashboard({
  event,
  initialParticipants,
}: {
  event: EventData
  initialParticipants: Participant[]
}) {
  const [tab, setTab] = useState<"roster" | "tickets" | "revenue" | "edit" | "broadcast">("roster")
  const [participants, setParticipants] = useState(initialParticipants)

  const pending = participants.filter((p) => p.status === "PENDING")
  const confirmed = participants.filter((p) => p.status === "CONFIRMED")
  const waitlisted = participants.filter((p) => p.status === "WAITLISTED")

  async function updateParticipant(id: string, body: { status?: Status; role?: Role }) {
    const res = await fetch(`/api/events/${event.id}/participants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: id, ...body }),
    })
    if (!res.ok) return
    setParticipants((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, ...body } : p))
        .filter((p) => p.status !== "CANCELLED")
    )
  }

  async function checkIn(args: { participantId?: string; code?: string; checkedIn?: boolean }): Promise<string | null> {
    const res = await fetch(`/api/events/${event.id}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    })
    const data = await res.json()
    if (!res.ok) return data.error || "Check-in failed"
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === data.participant.id ? { ...p, checkedInAt: data.participant.checkedInAt } : p
      )
    )
    return null
  }

  const tabs = [
    { key: "roster" as const, label: "Roster", icon: Users },
    { key: "tickets" as const, label: "Tickets", icon: Ticket },
    { key: "revenue" as const, label: "Revenue", icon: IndianRupee },
    { key: "edit" as const, label: "Edit", icon: Pencil },
    { key: "broadcast" as const, label: "Broadcast", icon: Megaphone },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">{event.title}</h1>
      <p className="text-sm text-zinc-500 mb-6">
        {confirmed.length} going{event.capacity ? ` · ${event.capacity} cap` : ""}
        {waitlisted.length ? ` · ${waitlisted.length} waitlisted` : ""}
        {pending.length ? ` · ${pending.length} pending` : ""}
      </p>

      <div className="flex gap-1 mb-6 border-b border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-zinc-400 hover:text-white"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.key === "roster" && pending.length > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[10px] px-1.5 py-0">
                {pending.length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {tab === "roster" && (
        <RosterTab
          pending={pending}
          confirmed={confirmed}
          waitlisted={waitlisted}
          onUpdate={updateParticipant}
          onCheckIn={checkIn}
        />
      )}
      {tab === "edit" && <EditTab event={event} />}
      {tab === "tickets" && <TicketsTab eventId={event.id} />}
      {tab === "revenue" && <RevenueTab eventId={event.id} />}
      {tab === "broadcast" && <BroadcastTab eventId={event.id} recipientCount={confirmed.length} />}
    </div>
  )
}

function PersonRow({
  p,
  children,
}: {
  p: Participant
  children?: ReactNode
}) {
  const initials = p.user.name?.charAt(0).toUpperCase() ?? "?"
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Avatar className="h-9 w-9">
        {p.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.user.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <AvatarFallback className="bg-orange-500/10 text-orange-500 text-xs font-bold">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{p.user.name || "Rider"}</p>
        {p.user.city && <p className="text-xs text-zinc-500 truncate">{p.user.city}</p>}
      </div>
      {children}
    </div>
  )
}

function RosterTab({
  pending,
  confirmed,
  waitlisted,
  onUpdate,
  onCheckIn,
}: {
  pending: Participant[]
  confirmed: Participant[]
  waitlisted: Participant[]
  onUpdate: (id: string, body: { status?: Status; role?: Role }) => void
  onCheckIn: (args: { participantId?: string; code?: string; checkedIn?: boolean }) => Promise<string | null>
}) {
  const [scanCode, setScanCode] = useState("")
  const [scanMsg, setScanMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submitCode() {
    if (!scanCode.trim()) return
    const error = await onCheckIn({ code: scanCode })
    setScanMsg(error ? { ok: false, text: error } : { ok: true, text: "Checked in ✓" })
    if (!error) setScanCode("")
    setTimeout(() => setScanMsg(null), 3000)
  }

  const checkedInCount = confirmed.filter((p) => p.checkedInAt).length

  return (
    <div className="space-y-8">
      {/* Assembly-point check-in: scan a pass QR (hardware scanners type the
          payload) or enter the rider's short code. */}
      <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white">Check-in</h2>
          <span className="text-xs text-zinc-500">
            {checkedInCount}/{confirmed.length} arrived
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Scan QR or type pass code (e.g. 7GK2-Q9XD)"
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCode()}
          />
          <Button variant="glow" onClick={submitCode} disabled={!scanCode.trim()}>
            Check in
          </Button>
        </div>
        {scanMsg && (
          <p className={cn("text-sm mt-2", scanMsg.ok ? "text-green-400" : "text-red-400")}>
            {scanMsg.text}
          </p>
        )}
      </section>
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white mb-2">Requests ({pending.length})</h2>
          <div className="divide-y divide-zinc-800/60">
            {pending.map((p) => (
              <PersonRow key={p.id} p={p}>
                <div className="flex gap-2">
                  <Button size="sm" variant="glow" className="h-8 gap-1" onClick={() => onUpdate(p.id, { status: "CONFIRMED" })}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => onUpdate(p.id, { status: "CANCELLED" })}>
                    <X className="h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              </PersonRow>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-white mb-2">Going ({confirmed.length})</h2>
        {confirmed.length === 0 ? (
          <p className="text-sm text-zinc-500">No confirmed riders yet.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {confirmed.map((p) => (
              <PersonRow key={p.id} p={p}>
                <div className="flex items-center gap-2">
                  {p.checkedInAt ? (
                    <button
                      onClick={() => onCheckIn({ participantId: p.id, checkedIn: false })}
                      title="Undo check-in"
                      className="inline-flex items-center gap-1 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium px-2 py-1.5 hover:bg-green-500/25"
                    >
                      <Check className="h-3.5 w-3.5" /> Arrived
                    </button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => onCheckIn({ participantId: p.id })}
                    >
                      Check in
                    </Button>
                  )}
                  <select
                    value={p.role}
                    onChange={(e) => onUpdate(p.id, { role: e.target.value as Role })}
                    className="h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 px-2"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400" onClick={() => onUpdate(p.id, { status: "CANCELLED" })}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </PersonRow>
            ))}
          </div>
        )}
      </section>

      {waitlisted.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white mb-2">Waitlist ({waitlisted.length})</h2>
          <div className="divide-y divide-zinc-800/60">
            {waitlisted.map((p) => (
              <PersonRow key={p.id} p={p}>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => onUpdate(p.id, { status: "CONFIRMED" })}>
                  <ArrowUp className="h-3.5 w-3.5" /> Promote
                </Button>
              </PersonRow>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function EditTab({ event }: { event: EventData }) {
  const [form, setForm] = useState({
    title: event.title,
    description: event.description,
    startDate: toLocalInput(event.startDate),
    endDate: toLocalInput(event.endDate),
    capacity: event.capacity?.toString() ?? "",
    requiresApproval: event.requiresApproval,
    status: event.status,
    coverImage: event.coverImage,
    startLocationAddress: event.startLocationAddress,
    destinationAddress: event.destinationAddress,
    assemblyPointAddress: event.assemblyPointAddress,
    assemblyPointTime: event.assemblyPointTime,
    checklist: event.checklist.join("\n"),
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
          capacity: form.capacity ? Number(form.capacity) : null,
          requiresApproval: form.requiresApproval,
          status: form.status,
          coverImage: form.coverImage,
          startLocationAddress: form.startLocationAddress || null,
          destinationAddress: form.destinationAddress || null,
          assemblyPointAddress: form.assemblyPointAddress || null,
          assemblyPointTime: form.assemblyPointTime || null,
          checklist: form.checklist
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const label = "block text-xs font-medium text-zinc-400 mb-1.5"

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <label className={label}>Cover image</label>
        <ImageUpload
          value={form.coverImage}
          onChange={(url) => setForm({ ...form, coverImage: url })}
          className="h-40"
        />
      </div>
      <div>
        <label className={label}>Title</label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <label className={label}>Description</label>
        <Textarea
          rows={5}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Starts</label>
          <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className={label}>Ends (optional)</label>
          <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Start location</label>
          <Input value={form.startLocationAddress} onChange={(e) => setForm({ ...form, startLocationAddress: e.target.value })} />
        </div>
        <div>
          <label className={label}>Destination</label>
          <Input value={form.destinationAddress} onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Assembly point</label>
          <Input value={form.assemblyPointAddress} onChange={(e) => setForm({ ...form, assemblyPointAddress: e.target.value })} />
        </div>
        <div>
          <label className={label}>Assembly time</label>
          <Input value={form.assemblyPointTime} onChange={(e) => setForm({ ...form, assemblyPointTime: e.target.value })} />
        </div>
      </div>
      <div>
        <label className={label}>Pre-ride checklist (one per line)</label>
        <Textarea
          rows={4}
          value={form.checklist}
          onChange={(e) => setForm({ ...form, checklist: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Capacity</label>
          <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
        <div>
          <label className={label}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full h-10 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 px-3"
          >
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={form.requiresApproval}
          onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
          className="rounded border-zinc-700 bg-zinc-900"
        />
        Require my approval before riders can join
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-3">
        <Button variant="glow" onClick={save} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
        {saved && <span className="text-sm text-green-400">Saved ✓</span>}
      </div>
    </div>
  )
}

interface TicketTier {
  id: string
  name: string
  description: string | null
  price: number
  quantity: number | null
  sold: number
}

function TicketsTab({ eventId }: { eventId: string }) {
  const [tiers, setTiers] = useState<TicketTier[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: "", description: "", price: "", quantity: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/events/${eventId}/ticket-types`)
      .then((r) => (r.ok ? r.json() : { ticketTypes: [] }))
      .then((d) => setTiers(d.ticketTypes))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId])

  async function add() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          price: Number(form.price) || 0,
          quantity: form.quantity ? Number(form.quantity) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not add")
      setTiers((prev) => [
        ...prev,
        { id: data.id, name: form.name, description: form.description || null, price: Number(form.price) || 0, quantity: form.quantity ? Number(form.quantity) : null, sold: 0 },
      ])
      setForm({ name: "", description: "", price: "", quantity: "" })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add")
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/events/${eventId}/ticket-types/${id}`, { method: "DELETE" })
    setTiers((prev) => prev.filter((t) => t.id !== id))
  }

  const label = "block text-xs font-medium text-zinc-400 mb-1.5"

  return (
    <div className="max-w-xl space-y-5">
      <p className="text-sm text-zinc-400">
        Add paid (or free) ticket tiers. Buyers check out securely; a paid ticket confirms them on the roster automatically — they get the pass, chat, and tracking like everyone else.
      </p>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
      ) : tiers.length > 0 ? (
        <div className="space-y-2">
          {tiers.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <Ticket className="h-4 w-4 text-orange-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-zinc-500">
                  {t.price > 0 ? `₹${t.price.toLocaleString("en-IN")}` : "Free"}
                  {t.quantity != null ? ` · ${t.sold}/${t.quantity} sold` : ` · ${t.sold} sold`}
                </p>
              </div>
              <button onClick={() => remove(t.id)} className="text-zinc-600 hover:text-red-400 p-1" title="Remove tier">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No ticket tiers yet — add one below (or leave empty for free RSVP).</p>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">New tier</h3>
        <div>
          <label className={label}>Name</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Early Bird" />
        </div>
        <div>
          <label className={label}>Description (optional)</label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's included" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Price (₹)</label>
            <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0 for free" />
          </div>
          <div>
            <label className={label}>Quantity (blank = unlimited)</label>
            <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 50" />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button variant="glow" onClick={add} disabled={saving || !form.name.trim()} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Add tier
        </Button>
      </div>
    </div>
  )
}

interface OrderRow {
  id: string
  buyer: string
  tier: string
  quantity: number
  amount: number
  platformFee: number
  net: number
  currency: string
  paymentId: string | null
  createdAt: string
}
interface RevenueSummary {
  gross: number
  fees: number
  net: number
  count: number
  tickets: number
  currency: string
}

function RevenueTab({ eventId }: { eventId: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [summary, setSummary] = useState<RevenueSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/events/${eventId}/orders`)
      .then((r) => (r.ok ? r.json() : { orders: [], summary: null }))
      .then((d) => {
        setOrders(d.orders ?? [])
        setSummary(d.summary ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId])

  const money = (n: number, c = "INR") =>
    `${c === "INR" ? "₹" : c + " "}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />

  if (!summary || summary.count === 0) {
    return (
      <p className="text-sm text-zinc-500 max-w-xl">
        No paid orders yet. Once riders buy tickets, you&apos;ll see gross revenue, the platform
        fee, your net payout, and a per-order breakdown here.
      </p>
    )
  }

  const cards = [
    { label: "Gross revenue", value: money(summary.gross, summary.currency) },
    { label: "Platform fee", value: money(summary.fees, summary.currency) },
    { label: "Net payout", value: money(summary.net, summary.currency) },
    { label: "Tickets sold", value: String(summary.tickets) },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-lg font-bold text-white">{c.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
              <th className="px-4 py-2.5 font-medium">Buyer</th>
              <th className="px-4 py-2.5 font-medium">Tier</th>
              <th className="px-4 py-2.5 font-medium text-right">Qty</th>
              <th className="px-4 py-2.5 font-medium text-right">Amount</th>
              <th className="px-4 py-2.5 font-medium text-right">Net</th>
              <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {orders.map((o) => (
              <tr key={o.id} className="text-zinc-300">
                <td className="px-4 py-2.5 text-white">{o.buyer}</td>
                <td className="px-4 py-2.5 text-zinc-400">{o.tier}</td>
                <td className="px-4 py-2.5 text-right">{o.quantity}</td>
                <td className="px-4 py-2.5 text-right">{money(o.amount, o.currency)}</td>
                <td className="px-4 py-2.5 text-right text-green-400">{money(o.net, o.currency)}</td>
                <td className="px-4 py-2.5 text-zinc-500 hidden sm:table-cell">
                  {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BroadcastTab({ eventId, recipientCount }: { eventId: string; recipientCount: number }) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setSending(true)
    setError(null)
    setSentCount(null)
    try {
      const res = await fetch(`/api/events/${eventId}/announce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send")
      setSentCount(data.sent)
      setMessage("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl">
      <p className="text-sm text-zinc-400 mb-3">
        Send a notification + email to all {recipientCount} confirmed rider
        {recipientCount === 1 ? "" : "s"} — assembly point, timing changes, reminders.
      </p>
      <Textarea
        rows={5}
        placeholder="We leave sharp at 6 AM from the Indiranagar HP pump. Fuel up the night before!"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      {sentCount !== null && (
        <p className="text-sm text-green-400 mt-2">Sent to {sentCount} rider{sentCount === 1 ? "" : "s"} ✓</p>
      )}
      <Button
        variant="glow"
        onClick={send}
        disabled={sending || !message.trim() || recipientCount === 0}
        className="gap-2 mt-3"
      >
        {sending && <Loader2 className="h-4 w-4 animate-spin" />}
        Send announcement
      </Button>
    </div>
  )
}
