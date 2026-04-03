"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Star, Search, Loader2, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type TargetType = "organization" | "user" | "event"

interface SearchResult {
  id: string
  name: string
  currentRating: number | null
}

export function AdminRatingOverride() {
  const [targetType, setTargetType] = useState<TargetType>("organization")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedTarget, setSelectedTarget] = useState<SearchResult | null>(null)
  const [newRating, setNewRating] = useState("")
  const [reason, setReason] = useState("")
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/admin/ratings/search?type=${targetType}&q=${encodeURIComponent(searchQuery)}`
      )
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      setSearchResults(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTarget || !newRating || reason.length < 10) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/admin/ratings/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId: selectedTarget.id,
          newRating: parseFloat(newRating),
          reason,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to override rating")
      }
      setSuccess(true)
      setSelectedTarget(null)
      setNewRating("")
      setReason("")
      setSearchResults([])
      setSearchQuery("")
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5 text-orange-500" />
            Override Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Target Type
              </label>
              <div className="relative">
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as TargetType)
                    setSelectedTarget(null)
                    setSearchResults([])
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 pl-3 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                  <option value="organization">Organization</option>
                  <option value="user">User</option>
                  <option value="event">Event</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Find Target
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${targetType}s...`}
                    className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleSearch()
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700"
                  onClick={handleSearch}
                  disabled={searching}
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1 rounded-lg border border-zinc-700 bg-zinc-800 p-1">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        setSelectedTarget(result)
                        setSearchResults([])
                      }}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-white hover:bg-zinc-700/50"
                    >
                      <span>{result.name}</span>
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                        {result.currentRating?.toFixed(1) ?? "N/A"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Target */}
            {selectedTarget && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {selectedTarget.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Current rating:{" "}
                      {selectedTarget.currentRating?.toFixed(1) ?? "No rating"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* New Rating */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                New Rating (0-5)
              </label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={newRating}
                onChange={(e) => setNewRating(e.target.value)}
                placeholder="e.g. 4.2"
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Reason <span className="text-zinc-500">(min 10 characters)</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why the rating is being overridden..."
                rows={3}
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              />
              {reason.length > 0 && reason.length < 10 && (
                <p className="mt-1 text-xs text-red-400">
                  Reason must be at least 10 characters
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                Rating override applied successfully!
              </div>
            )}

            <Button
              type="submit"
              variant="glow"
              className="w-full"
              disabled={
                submitting ||
                !selectedTarget ||
                !newRating ||
                reason.length < 10
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply Override"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
