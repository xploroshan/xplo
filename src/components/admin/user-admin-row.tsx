"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, ShieldCheck, BadgeCheck, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const ROLES = ["USER", "ORGANIZER", "ADMIN", "SUPER_ADMIN"] as const

export interface AdminUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  banned: boolean
  verified: boolean
  city: string | null
  createdAt: string
  events: number
}

export function UserAdminRow({ user, canSuper }: { user: AdminUser; canSuper: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [u, setU] = useState(user)

  async function patch(data: Record<string, unknown>) {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) setU((prev) => ({ ...prev, ...data }))
      else router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const targetIsAdmin = ["ADMIN", "SUPER_ADMIN"].includes(u.role)
  const canEditRole = canSuper || !targetIsAdmin

  return (
    <tr className={cn("border-b border-zinc-800/50", u.banned && "opacity-50")}>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            {u.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">{u.name?.charAt(0) ?? "?"}</AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-white truncate">{u.name ?? "—"}</span>
              {u.verified && <BadgeCheck className="h-3.5 w-3.5 text-orange-500" />}
            </div>
            <span className="text-xs text-zinc-500 truncate">{u.email}</span>
          </div>
        </div>
      </td>
      <td className="py-2.5 pr-3">
        <select
          value={u.role}
          disabled={busy || !canEditRole}
          onChange={(e) => patch({ role: e.target.value })}
          className="h-7 rounded-md bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 px-2 disabled:opacity-50"
        >
          {ROLES.map((r) => (
            <option key={r} value={r} disabled={["ADMIN", "SUPER_ADMIN"].includes(r) && !canSuper}>
              {r}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2.5 pr-3 text-xs text-zinc-500">{u.events}</td>
      <td className="py-2.5 pr-3">
        {u.banned ? <Badge className="bg-red-500/15 text-red-400 border-0 text-[10px]">Banned</Badge> : null}
      </td>
      <td className="py-2.5 text-right">
        <div className="inline-flex items-center gap-1">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />}
          <button
            onClick={() => patch({ verified: !u.verified })}
            disabled={busy}
            title={u.verified ? "Unverify" : "Verify"}
            className={cn("p-1.5 rounded-md hover:bg-zinc-800", u.verified ? "text-orange-400" : "text-zinc-500")}
          >
            <BadgeCheck className="h-4 w-4" />
          </button>
          {(canSuper || !targetIsAdmin) && (
            <button
              onClick={() => patch({ banned: !u.banned })}
              disabled={busy}
              title={u.banned ? "Unban" : "Ban"}
              className={cn("p-1.5 rounded-md hover:bg-zinc-800", u.banned ? "text-green-400" : "text-zinc-500 hover:text-red-400")}
            >
              {u.banned ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
