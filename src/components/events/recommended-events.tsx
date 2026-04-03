"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { EventCardCompact } from "@/components/events/event-card-compact"
import { Badge } from "@/components/ui/badge"
import type { MockEvent } from "@/lib/mock-data"

interface Recommendation {
  event: MockEvent
  matchScore: number
  reason: string
}

export function RecommendedEvents() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/ai/recommendations")
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setRecommendations(data.recommendations || [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  // Don't render if error or no recommendations
  if (error || (!loading && recommendations.length === 0)) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-orange-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">
            Recommended for You
          </h3>
          <p className="text-xs text-zinc-500">
            AI-curated events based on your interests
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[280px] rounded-xl border border-zinc-800/50 bg-zinc-900/50 animate-pulse"
            >
              <div className="h-28 bg-zinc-800/50" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
                <div className="h-3 bg-zinc-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Horizontal Scrollable Row */}
      {!loading && recommendations.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 -mx-1 px-1">
          {recommendations.map((rec, i) => (
            <motion.div
              key={rec.event.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="relative shrink-0"
            >
              {/* Match Score Badge */}
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-orange-500/90 text-white border-0 text-[10px] font-bold shadow-lg shadow-orange-500/20">
                  {rec.matchScore}% match
                </Badge>
              </div>

              <EventCardCompact event={rec.event} />

              {/* Reason Text */}
              <div className="mt-1.5 px-1">
                <p className="text-[11px] text-zinc-500 line-clamp-1">
                  {rec.reason}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
