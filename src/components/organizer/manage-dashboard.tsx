"use client"

import { useState, type ReactNode } from "react"
import { Users, Pencil, Megaphone, Check, X, ArrowUp, Loader2 } from "lucide-react"
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
  const [tab, setTab] = useState<"roster" | "edit" | "broadcast">("roster")
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

  const tabs = [
    { key: "roster" as const, label: "Roster", icon: Users },
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
        />
      )}
      {tab === "edit" && <EditTab event={event} />}
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
          <img src={p.user.image} alt="" className="h-full w-full object-cover" />
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
}: {
  pending: Participant[]
  confirmed: Participant[]
  waitlisted: Participant[]
  onUpdate: (id: string, body: { status?: Status; role?: Role }) => void
}) {
  return (
    <div className="space-y-8">
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
