"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Trophy,
  Star,
  Lightbulb,
  Users,
  TrendingUp,
  BarChart3,
  AlertCircle,
} from "lucide-react"

interface EventSummary {
  summary: string
  highlights: string[]
  stats: {
    participants: number
    completionRate: number
    avgRating: number
  }
  organizerInsights: string
}

interface EventSummaryCardProps {
  eventId: string
  className?: string
}

export function EventSummaryCard({ eventId, className }: EventSummaryCardProps) {
  const [data, setData] = useState<EventSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/ai/event-summary?eventId=${eventId}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const result = await res.json()
        setData(result.summary || null)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [eventId])

  if (error) {
    return (
      <div
        className={`rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6 ${className ?? ""}`}
      >
        <div className="flex items-center gap-2 text-zinc-400">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">Could not load event summary.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className={`rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6 animate-pulse ${className ?? ""}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-zinc-800" />
          <div className="h-5 bg-zinc-800 rounded w-40" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-800 rounded w-3/4" />
          <div className="h-3 bg-zinc-800 rounded w-1/2" />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="h-16 bg-zinc-800 rounded-lg" />
          <div className="h-16 bg-zinc-800 rounded-lg" />
          <div className="h-16 bg-zinc-800 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden ${className ?? ""}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800/50">
        <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Trophy className="h-4 w-4 text-amber-400" />
        </div>
        <h3 className="text-base font-semibold text-white">Event Summary</h3>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary Text */}
        <p className="text-sm text-zinc-300 leading-relaxed">{data.summary}</p>

        {/* Highlights */}
        {data.highlights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Highlights
            </h4>
            <ol className="space-y-2">
              {data.highlights.map((highlight, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Star className="h-3 w-3 text-amber-400" />
                  </div>
                  <span className="text-sm text-zinc-300">{highlight}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/30 p-3 text-center">
            <Users className="h-4 w-4 text-blue-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-white">
              {data.stats.participants}
            </p>
            <p className="text-[10px] text-zinc-500">Participants</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/30 p-3 text-center">
            <TrendingUp className="h-4 w-4 text-green-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-white">
              {data.stats.completionRate}%
            </p>
            <p className="text-[10px] text-zinc-500">Completion</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/30 p-3 text-center">
            <BarChart3 className="h-4 w-4 text-amber-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-white">
              {data.stats.avgRating.toFixed(1)}
            </p>
            <p className="text-[10px] text-zinc-500">Avg Rating</p>
          </div>
        </div>

        {/* Organizer Insights */}
        {data.organizerInsights && (
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-4">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-medium text-amber-300 mb-1">
                  Organizer Insights
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {data.organizerInsights}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
