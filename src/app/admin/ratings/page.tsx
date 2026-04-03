"use client"

import { useState, useEffect } from "react"
import {
  Star,
  Search,
  Loader2,
  AlertTriangle,
  Clock,
  User,
  Building2,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface OverrideLog {
  id: string
  targetType: string
  targetId: string
  previousValue: number | null
  newValue: number | null
  reason: string
  createdAt: string
  admin: { name: string | null }
}

export default function AdminRatingsPage() {
  const [targetType, setTargetType] = useState<"organization" | "user" | "event">("organization")
  const [targetId, setTargetId] = useState("")
  const [newValue, setNewValue] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [logs, setLogs] = useState<OverrideLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/ratings/overrides")
      .then((res) => res.json())
      .then((data) => setLogs(data.overrides || []))
      .catch(() => {})
      .finally(() => setLogsLoading(false))
  }, [])

  async function handleOverride(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch("/api/admin/ratings/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          newValue: newValue ? parseFloat(newValue) : null,
          reason,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: "success", text: "Rating override applied successfully" })
        setTargetId("")
        setNewValue("")
        setReason("")
        // Refresh logs
        const logsRes = await fetch("/api/admin/ratings/overrides")
        const logsData = await logsRes.json()
        setLogs(logsData.overrides || [])
      } else {
        setMessage({ type: "error", text: data.error || "Failed to override rating" })
      }
    } catch {
      setMessage({ type: "error", text: "Network error" })
    }
    setSubmitting(false)
  }

  const targetIcons = {
    organization: Building2,
    user: User,
    event: Calendar,
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Star className="h-8 w-8 text-orange-500" />
          Rating Overrides
        </h1>
        <p className="text-zinc-400 mt-1">Override ratings for organizations, users, or events. All changes are logged.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Override Form */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Apply Override
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOverride} className="space-y-4">
              {/* Target Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Target Type</label>
                <div className="flex gap-2">
                  {(["organization", "user", "event"] as const).map((t) => {
                    const Icon = targetIcons[t]
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTargetType(t)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${
                          targetType === t
                            ? "border-orange-500 bg-orange-500/10 text-orange-500"
                            : "border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Target ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Target ID</label>
                <Input
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder={`Enter ${targetType} ID`}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              {/* New Value */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">New Rating (0-5, leave empty to clear)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. 4.5"
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Reason (required)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this override is being applied (min 10 chars)..."
                  rows={3}
                  required
                  minLength={10}
                  className="w-full rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                variant="glow"
                className="w-full rounded-xl"
                disabled={submitting || !targetId || !reason || reason.length < 10}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply Override"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Override History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No overrides yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {logs.map((log) => {
                  const Icon = targetIcons[log.targetType as keyof typeof targetIcons] || Star
                  return (
                    <div
                      key={log.id}
                      className="rounded-lg bg-zinc-800/30 border border-zinc-800 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-zinc-400" />
                          <Badge className="text-[10px] bg-zinc-700 text-zinc-300 border-0">
                            {log.targetType}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span className="text-zinc-500">
                          {log.previousValue?.toFixed(1) ?? "N/A"}
                        </span>
                        <span className="text-zinc-600">&rarr;</span>
                        <span className="text-orange-500 font-medium">
                          {log.newValue?.toFixed(1) ?? "Cleared"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2">{log.reason}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">by {log.admin.name || "Admin"}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
