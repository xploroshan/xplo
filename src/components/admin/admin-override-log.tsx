"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ScrollText, Star, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface OverrideEntry {
  id: string
  createdAt: string
  targetType: string
  targetName: string
  previousRating: number | null
  newRating: number
  adminName: string
  reason: string
}

export function AdminOverrideLog() {
  const [entries, setEntries] = useState<OverrideEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    async function fetchLog() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/ratings/overrides?page=${page}&limit=10`)
        if (!res.ok) throw new Error("Failed to load")
        const data = await res.json()
        setEntries(data.entries ?? data.overrides ?? [])
        setTotalPages(data.totalPages ?? 1)
      } catch {
        setEntries([])
      } finally {
        setLoading(false)
      }
    }
    fetchLog()
  }, [page])

  const targetTypeConfig: Record<string, { color: string; bg: string }> = {
    organization: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    user: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    event: { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ScrollText className="h-5 w-5 text-orange-500" />
            Override Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : entries.length > 0 ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80">
                      <th className="px-3 py-2.5 text-left font-medium text-zinc-400">
                        Date
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-zinc-400">
                        Target
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium text-zinc-400">
                        Previous
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium text-zinc-400">
                        New
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-zinc-400">
                        Admin
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-zinc-400">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const ttc = targetTypeConfig[entry.targetType] ?? targetTypeConfig.user
                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/20"
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 text-xs text-zinc-400">
                            {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <Badge className={`border text-[10px] capitalize ${ttc.bg} ${ttc.color}`}>
                                {entry.targetType}
                              </Badge>
                              <span className="text-sm text-white">{entry.targetName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="flex items-center justify-center gap-1 text-zinc-400">
                              <Star className="h-3 w-3" />
                              {entry.previousRating?.toFixed(1) ?? "N/A"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="flex items-center justify-center gap-1 font-medium text-orange-400">
                              <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                              {entry.newRating.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-sm text-zinc-300">
                            {entry.adminName}
                          </td>
                          <td className="max-w-xs truncate px-3 py-2.5 text-xs text-zinc-400">
                            {entry.reason}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <ScrollText className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-zinc-500">No rating overrides yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
