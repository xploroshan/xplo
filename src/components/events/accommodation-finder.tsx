"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Bed,
  Loader2,
  Star,
  ExternalLink,
  AlertCircle,
  MapPin,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Accommodation {
  name: string
  type: string
  rating: number
  priceRange: string
  description: string
  amenities: string[]
  distance: string
  tier: "budget" | "mid-range" | "premium"
  bookingLinks: {
    makemytrip?: string
    agoda?: string
    bookingcom?: string
    googlemaps?: string
  }
}

const TIER_TABS = [
  { key: "budget" as const, label: "Budget", price: "Under $50/night" },
  { key: "mid-range" as const, label: "Mid-Range", price: "$50-150/night" },
  { key: "premium" as const, label: "Premium", price: "$150+/night" },
]

const TYPE_COLORS: Record<string, string> = {
  hotel: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  hostel: "bg-green-500/15 text-green-400 border-green-500/20",
  resort: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  homestay: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  guesthouse: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  villa: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  default: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
}

interface AccommodationFinderProps {
  eventId: string
  destination: string
  startDate: string
}

export function AccommodationFinder({
  eventId,
  destination,
  startDate,
}: AccommodationFinderProps) {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const [activeTier, setActiveTier] = useState<"budget" | "mid-range" | "premium">("mid-range")

  const fetchAccommodations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ai/accommodations?eventId=${eventId}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setAccommodations(data.accommodations || [])
      setFetched(true)
    } catch {
      setError("Could not load accommodations. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchAccommodations()
  }, [fetchAccommodations])

  const filtered = accommodations.filter((a) => a.tier === activeTier)

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-700"
            }`}
          />
        ))}
        <span className="text-[11px] text-zinc-400 ml-1">{rating.toFixed(1)}</span>
      </div>
    )
  }

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
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
          <Bed className="h-4 w-4 text-orange-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Where to Stay</h3>
          <p className="text-xs text-zinc-500">
            Near {destination} &middot; {startDate}
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 animate-pulse"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 bg-zinc-800 rounded w-1/3" />
                  <div className="h-4 bg-zinc-800 rounded w-16" />
                </div>
                <div className="h-3 bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-zinc-800 rounded w-16" />
                  <div className="h-6 bg-zinc-800 rounded w-16" />
                  <div className="h-6 bg-zinc-800 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetched && (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 p-8 text-center">
          <Bed className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 mb-4">
            Find the best places to stay near your event
          </p>
          <Button
            onClick={fetchAccommodations}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
          >
            <Bed className="h-4 w-4 mr-2" />
            Find Accommodations
          </Button>
        </div>
      )}

      {/* Content */}
      {!loading && fetched && (
        <>
          {/* Tier Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
            {TIER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTier(tab.key)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTier === tab.key
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                    : "text-zinc-400 hover:text-zinc-300 border border-transparent"
                }`}
              >
                <div>{tab.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{tab.price}</div>
              </button>
            ))}
          </div>

          {/* Accommodation Cards */}
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((acc, i) => {
                const typeColor =
                  TYPE_COLORS[acc.type.toLowerCase()] || TYPE_COLORS.default

                return (
                  <motion.div
                    key={acc.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors"
                  >
                    {/* Name + Type */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white">
                            {acc.name}
                          </h4>
                          <Badge
                            className={`text-[10px] border shrink-0 ${typeColor}`}
                          >
                            {acc.type}
                          </Badge>
                        </div>
                        {renderStars(acc.rating)}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">
                          {acc.priceRange}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {acc.distance}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
                      {acc.description}
                    </p>

                    {/* Amenities */}
                    {acc.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {acc.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Booking Links */}
                    <div className="flex flex-wrap gap-2">
                      {acc.bookingLinks.makemytrip && (
                        <a
                          href={acc.bookingLinks.makemytrip}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
                        >
                          MakeMyTrip
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {acc.bookingLinks.agoda && (
                        <a
                          href={acc.bookingLinks.agoda}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors"
                        >
                          Agoda
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {acc.bookingLinks.bookingcom && (
                        <a
                          href={acc.bookingLinks.bookingcom}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/25 transition-colors"
                        >
                          Booking.com
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {acc.bookingLinks.googlemaps && (
                        <a
                          href={acc.bookingLinks.googlemaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors"
                        >
                          Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6 text-center">
              <p className="text-sm text-zinc-400">
                No {activeTier} accommodations found for this destination.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
