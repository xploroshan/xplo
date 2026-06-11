"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import { Loader2 } from "lucide-react"
import { geocode } from "@/lib/geocode"

export interface MapEvent {
  slug: string
  title: string
  address: string
  dateText: string
  typeColor?: string
}

// Map view for the events list — geocodes each event's destination and drops a
// clickable marker. Capped to keep Nominatim usage polite; cache makes repeats free.
export function EventsMapView({ events }: { events: MapEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [plotted, setPlotted] = useState(0)

  useEffect(() => {
    let cancelled = false
    let map: import("leaflet").Map | null = null

    async function init() {
      const L = (await import("leaflet")).default
      if (cancelled || !containerRef.current) return

      map = L.map(containerRef.current, { scrollWheelZoom: true })
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
      // Default to a wide view of India until markers arrive.
      map.setView([22.0, 79.0], 5)

      const bounds: [number, number][] = []
      // Geocode sequentially (≤ ~25) to respect Nominatim's rate guidance.
      for (const ev of events.slice(0, 25)) {
        if (cancelled) break
        const p = await geocode(ev.address)
        if (!p || cancelled || !map) continue
        bounds.push([p.lat, p.lng])
        L.circleMarker([p.lat, p.lng], {
          radius: 8,
          color: ev.typeColor ?? "#f97316",
          fillColor: ev.typeColor ?? "#f97316",
          fillOpacity: 0.85,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${ev.title}</strong><br/>${ev.dateText}<br/><a href="/events/${ev.slug}">View event →</a>`
          )
        setPlotted((n) => n + 1)
        if (bounds.length > 0) {
          map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 11 })
        }
      }
      if (!cancelled) setLoading(false)
    }

    init()
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [events])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[60vh] w-full rounded-2xl border border-zinc-800/50 overflow-hidden z-0"
      />
      {loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Plotting events… {plotted}/{Math.min(events.length, 25)}
        </div>
      )}
    </div>
  )
}
