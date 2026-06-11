"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"

interface EventMapProps {
  startAddress?: string | null
  destinationAddress?: string | null
  className?: string
}

interface Point {
  lat: number
  lng: number
  label: string
}

// Geocode an address via Nominatim (OpenStreetMap), cached in sessionStorage
// so repeat views don't re-hit the API (their usage policy asks for restraint).
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = `geo:${address}`
  try {
    const cached = sessionStorage.getItem(key)
    if (cached) return JSON.parse(cached)
  } catch {
    // sessionStorage unavailable — fall through to fetch
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { Accept: "application/json" } }
    )
    const data = await res.json()
    if (!Array.isArray(data) || !data[0]) return null
    const point = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    try {
      sessionStorage.setItem(key, JSON.stringify(point))
    } catch {
      // best-effort cache
    }
    return point
  } catch {
    return null
  }
}

export function EventMap({ startAddress, destinationAddress, className }: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Leaflet touches `window` at import time — load it client-side only.
    async function init() {
      const points: Point[] = []
      if (startAddress) {
        const p = await geocode(startAddress)
        if (p) points.push({ ...p, label: `Start: ${startAddress}` })
      }
      if (destinationAddress && destinationAddress !== startAddress) {
        const p = await geocode(destinationAddress)
        if (p) points.push({ ...p, label: `Destination: ${destinationAddress}` })
      }
      if (cancelled) return
      if (points.length === 0 || !containerRef.current) {
        setFailed(true)
        return
      }

      const L = (await import("leaflet")).default
      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      })
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const colors = ["#22c55e", "#ef4444"] // start green, destination red
      points.forEach((pt, i) => {
        L.circleMarker([pt.lat, pt.lng], {
          radius: 9,
          color: colors[i] ?? "#f97316",
          fillColor: colors[i] ?? "#f97316",
          fillOpacity: 0.85,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(pt.label)
      })

      if (points.length === 2) {
        L.polyline(
          points.map((p) => [p.lat, p.lng] as [number, number]),
          { color: "#f97316", weight: 3, opacity: 0.7, dashArray: "8 8" }
        ).addTo(map)
        map.fitBounds(
          L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
          { padding: [40, 40] }
        )
      } else {
        map.setView([points[0].lat, points[0].lng], 12)
      }

      return () => map.remove()
    }

    let cleanup: (() => void) | undefined
    init().then((fn) => {
      if (typeof fn === "function") cleanup = fn
    })
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [startAddress, destinationAddress])

  if (failed) return null
  if (!startAddress && !destinationAddress) return null

  return (
    <div
      ref={containerRef}
      className={className ?? "h-64 w-full rounded-2xl border border-zinc-800/50 overflow-hidden z-0"}
    />
  )
}
