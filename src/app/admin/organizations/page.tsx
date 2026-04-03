"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  Search,
  Loader2,
  BadgeCheck,
  Star,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Award,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AdminOrg {
  id: string
  name: string
  slug: string
  logo: string | null
  city: string | null
  verified: boolean
  featured: boolean
  status: "PENDING" | "ACTIVE" | "SUSPENDED"
  avgRating: number | null
  ratingCount: number
  _count: { members: number; events: number }
  createdAt: string
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<AdminOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (search) params.set("search", search)

    fetch(`/api/admin/organizations?${params}`)
      .then((res) => res.json())
      .then((data) => setOrgs(data.organizations || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, statusFilter])

  async function handleAction(orgId: string, action: Record<string, unknown>) {
    setActionLoading(orgId)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      })
      if (res.ok) {
        setOrgs((prev) =>
          prev.map((o) =>
            o.id === orgId ? { ...o, ...action } : o
          )
        )
      }
    } catch {
      // ignore
    }
    setActionLoading(null)
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-500/20 text-amber-400",
    ACTIVE: "bg-green-500/20 text-green-400",
    SUSPENDED: "bg-red-500/20 text-red-400",
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Building2 className="h-8 w-8 text-orange-500" />
          Organizations
        </h1>
        <p className="text-zinc-400 mt-1">Manage organizations, approve registrations, and moderate.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-3 rounded-xl bg-zinc-900/50 border border-zinc-800 px-4 py-3">
          <Search className="h-5 w-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-full"
          />
        </div>
        <div className="flex gap-2">
          {["all", "PENDING", "ACTIVE", "SUSPENDED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "border-orange-500 bg-orange-500/10 text-orange-500"
                  : "border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : orgs.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No organizations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-xs font-medium text-zinc-500 px-6 py-4">Organization</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-4">Status</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-4">Members</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-4">Events</th>
                    <th className="text-left text-xs font-medium text-zinc-500 px-4 py-4">Rating</th>
                    <th className="text-right text-xs font-medium text-zinc-500 px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org) => (
                    <tr key={org.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {org.logo ? (
                            <img src={org.logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
                              {org.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-white">{org.name}</span>
                              {org.verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />}
                              {org.featured && <Award className="h-3.5 w-3.5 text-amber-500" />}
                            </div>
                            <span className="text-xs text-zinc-500">/org/{org.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`${statusColors[org.status]} border-0 text-xs`}>
                          {org.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-400">{org._count.members}</td>
                      <td className="px-4 py-4 text-sm text-zinc-400">{org._count.events}</td>
                      <td className="px-4 py-4">
                        {org.avgRating ? (
                          <span className="flex items-center gap-1 text-sm text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-500" />
                            {org.avgRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {org.status === "PENDING" && (
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border-0"
                              onClick={() => handleAction(org.id, { status: "ACTIVE" })}
                              disabled={actionLoading === org.id}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                          )}
                          {org.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0"
                              onClick={() => handleAction(org.id, { status: "SUSPENDED" })}
                              disabled={actionLoading === org.id}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {org.status === "SUSPENDED" && (
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 border-0"
                              onClick={() => handleAction(org.id, { status: "ACTIVE" })}
                              disabled={actionLoading === org.id}
                            >
                              Reactivate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-zinc-700 text-xs"
                            onClick={() => handleAction(org.id, { verified: !org.verified })}
                            disabled={actionLoading === org.id}
                          >
                            {org.verified ? "Unverify" : "Verify"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
