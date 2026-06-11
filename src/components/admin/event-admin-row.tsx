"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Star, Archive, Loader2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUSES = ["DRAFT", "PUBLISHED", "OPEN", "CLOSED", "ACTIVE", "COMPLETED", "ARCHIVED"] as const

export interface AdminEvent {
  id: string
  slug: string
  title: string
  status: string
  featured: boolean
  organizerName: string | null
  participants: number
  startDate: string
}

export function EventAdminRow({ event }: { event: AdminEvent }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [e, setE] = useState(event)

  async function patch(data: Record<string, unknown>) {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/events/${e.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) setE((prev) => ({ ...prev, ...data }))
      else router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr className={cn("border-b border-zinc-800/50", e.status === "ARCHIVED" && "opacity-50")}>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-white truncate">{e.title}</span>
          <Link href={`/events/${e.slug}`} className="text-zinc-600 hover:text-orange-400 shrink-0">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        <span className="text-xs text-zinc-500">{e.organizerName ?? "—"}</span>
      </td>
      <td className="py-2.5 pr-3">
        <select
          value={e.status}
          disabled={busy}
          onChange={(ev) => patch({ status: ev.target.value })}
          className="h-7 rounded-md bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 px-2"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
      <td className="py-2.5 pr-3 text-xs text-zinc-500">{e.participants}</td>
      <td className="py-2.5 text-right">
        <div className="inline-flex items-center gap-1">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />}
          <button
            onClick={() => patch({ featured: !e.featured })}
            disabled={busy}
            title={e.featured ? "Unfeature" : "Feature"}
            className={cn("p-1.5 rounded-md hover:bg-zinc-800", e.featured ? "text-amber-400" : "text-zinc-500")}
          >
            <Star className={cn("h-4 w-4", e.featured && "fill-amber-400")} />
          </button>
          {e.status !== "ARCHIVED" && (
            <button
              onClick={() => patch({ status: "ARCHIVED" })}
              disabled={busy}
              title="Archive"
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
