"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, X } from "lucide-react"
import { reverseCity } from "@/lib/geocode"

// When no city filter is active, gently suggest the user's detected city.
// Uses browser geolocation (with permission); silent if denied/unavailable.
export function CityAutoDetect() {
  const [city, setCity] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem("city-detect-dismissed")) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const name = await reverseCity(pos.coords.latitude, pos.coords.longitude)
        if (name) setCity(name)
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    )
  }, [])

  if (!city || dismissed) return null

  return (
    <div className="flex items-center gap-2 max-w-xl mx-auto rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-sm">
      <MapPin className="h-4 w-4 text-orange-400 shrink-0" />
      <span className="text-zinc-300">
        Near <span className="font-medium text-white">{city}</span>?
      </span>
      <Link
        href={`/events?city=${encodeURIComponent(city)}`}
        className="font-medium text-orange-400 hover:text-orange-300"
      >
        Show events here
      </Link>
      <button
        onClick={() => {
          setDismissed(true)
          try {
            sessionStorage.setItem("city-detect-dismissed", "1")
          } catch {
            /* ignore */
          }
        }}
        className="ml-auto text-zinc-500 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
