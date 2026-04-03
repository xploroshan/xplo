"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  MapPin,
  Loader2,
  Landmark,
  UtensilsCrossed,
  TreePine,
  Camera,
  ShoppingBag,
  Church,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface POI {
  name: string
  type: string
  description: string
  distance: string
  icon: string
  highlights: string[]
}

const TYPE_COLORS: Record<string, string> = {
  landmark: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  restaurant: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  nature: "bg-green-500/15 text-green-400 border-green-500/20",
  viewpoint: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  shopping: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  temple: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  default: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
}

const ICON_MAP: Record<string, React.ElementType> = {
  landmark: Landmark,
  restaurant: UtensilsCrossed,
  nature: TreePine,
  viewpoint: Camera,
  shopping: ShoppingBag,
  temple: Church,
}

interface PlacesOfInterestProps {
  eventId: string
  destination: string
}

export function PlacesOfInterest({ eventId, destination }: PlacesOfInterestProps) {
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const fetchPois = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ai/places-of-interest?eventId=${eventId}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setPois(data.places || [])
      setFetched(true)
    } catch {
      setError("Could not load nearby places. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchPois()
  }, [fetchPois])

  if (error && !fetched) {
    return (
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-2 text-zinc-400">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Nearby Attractions
            </h3>
            <p className="text-xs text-zinc-500">Near {destination}</p>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/3" />
                  <div className="h-3 bg-zinc-800 rounded w-full" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state - not yet generated */}
      {!loading && !fetched && (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 p-8 text-center">
          <MapPin className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 mb-4">
            Discover interesting places near your event destination
          </p>
          <Button
            onClick={fetchPois}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Discover nearby places
          </Button>
        </div>
      )}

      {/* POI Grid */}
      {!loading && fetched && pois.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pois.map((poi, i) => {
            const IconComponent = ICON_MAP[poi.icon] || MapPin
            const colorClass = TYPE_COLORS[poi.type] || TYPE_COLORS.default

            return (
              <motion.div
                key={poi.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0">
                    <IconComponent className="h-5 w-5 text-zinc-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {poi.name}
                      </h4>
                      <Badge
                        className={`text-[10px] border shrink-0 ${colorClass}`}
                      >
                        {poi.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
                      {poi.description}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 mb-2">
                      <MapPin className="h-3 w-3" />
                      {poi.distance}
                    </div>
                    {poi.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {poi.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
