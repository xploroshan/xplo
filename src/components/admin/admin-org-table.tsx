"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Search,
  MoreHorizontal,
  Check,
  Ban,
  Sparkles,
  Star,
  Loader2,
  Building2,
  ChevronDown,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface OrgRow {
  id: string
  name: string
  slug: string
  status: "PENDING" | "ACTIVE" | "SUSPENDED"
  memberCount: number
  eventCount: number
  avgRating: number | null
  featured?: boolean
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ACTIVE: { label: "Active", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  SUSPENDED: { label: "Suspended", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
}

export function AdminOrgTable() {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const fetchOrgs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/organizations?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      setOrgs(Array.isArray(data) ? data : data.organizations ?? [])
    } catch {
      setOrgs([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const debounce = setTimeout(fetchOrgs, 300)
    return () => clearTimeout(debounce)
  }, [fetchOrgs])

  async function handleAction(orgId: string, action: string) {
    try {
      await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      fetchOrgs()
    } catch {
      // silent
    }
    setOpenMenu(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 pl-3 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 sm:w-40"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : orgs.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  Organization
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-medium text-zinc-400">
                  Members
                </th>
                <th className="px-4 py-3 text-center font-medium text-zinc-400">
                  Events
                </th>
                <th className="px-4 py-3 text-center font-medium text-zinc-400">
                  Rating
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                const status = statusConfig[org.status] ?? statusConfig.ACTIVE
                return (
                  <tr
                    key={org.id}
                    className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{org.name}</span>
                        {org.featured && (
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">/org/{org.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`border text-[10px] ${status.bg} ${status.color}`}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-300">
                      {org.memberCount}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-300">
                      {org.eventCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {org.avgRating !== null ? (
                        <span className="flex items-center justify-center gap-1 text-zinc-300">
                          <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                          {org.avgRating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setOpenMenu(openMenu === org.id ? null : org.id)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                        </Button>
                        {openMenu === org.id && (
                          <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl">
                            <button
                              onClick={() => handleAction(org.id, "approve")}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-zinc-700/50"
                            >
                              <Check className="h-4 w-4 text-green-400" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(org.id, "suspend")}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-zinc-700/50"
                            >
                              <Ban className="h-4 w-4 text-red-400" />
                              Suspend
                            </button>
                            <button
                              onClick={() => handleAction(org.id, "feature")}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-zinc-700/50"
                            >
                              <Sparkles className="h-4 w-4 text-amber-400" />
                              {org.featured ? "Unfeature" : "Feature"}
                            </button>
                            <button
                              onClick={() => handleAction(org.id, "override-rating")}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-zinc-700/50"
                            >
                              <Star className="h-4 w-4 text-orange-400" />
                              Override Rating
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-zinc-500">No organizations found</p>
        </div>
      )}
    </motion.div>
  )
}
