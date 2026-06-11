"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import type * as Leaflet from "leaflet"
import * as Ably from "ably"
import { LocateFixed, Loader2, Play, Square, Siren } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Rider {
  userId: string
  name: string | null
  role: string
  lat: number
  lng: number
  speedKmh?: number | null
  at: string
}

const ROLE_COLOR: Record<string, string> = {
  PILOT: "#22c55e",     // green (FR-4.2)
  SWEEP: "#ef4444",     // red (FR-4.2)
  ORGANIZER: "#f97316", // brand orange
  MODERATOR: "#a855f7",
  MEMBER: "#3b82f6",
}

const STALE_MS = 90_000 // fade riders not heard from in 90s

interface LiveMapProps {
  eventId: string
  isOrganizer: boolean
  initialStatus: string
  realtime: boolean
}

export function LiveMap({ eventId, isOrganizer, initialStatus, realtime }: LiveMapProps) {
  const mapRef = useRef<Leaflet.Map | null>(null)
  const LRef = useRef<typeof Leaflet | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, Leaflet.CircleMarker>>(new Map())
  const trailsRef = useRef<Map<string, Leaflet.Polyline>>(new Map())
  const fittedRef = useRef(false)
  const watchIdRef = useRef<number | null>(null)
  const lastSentRef = useRef(0)

  const [status, setStatus] = useState(initialStatus)
  const [sharing, setSharing] = useState(false)
  const [riders, setRiders] = useState<Map<string, Rider>>(new Map())
  const [geoError, setGeoError] = useState<string | null>(null)
  const [sosState, setSosState] = useState<"idle" | "confirm" | "sent">("idle")
  const [busy, setBusy] = useState(false)

  // ── Map plumbing ──────────────────────────────────────────────────────────

  const upsertMarker = useCallback((r: Rider) => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return
    const color = ROLE_COLOR[r.role] ?? ROLE_COLOR.MEMBER
    const stale = Date.now() - new Date(r.at).getTime() > STALE_MS
    const existing = markersRef.current.get(r.userId)
    if (existing) {
      existing.setLatLng([r.lat, r.lng])
      existing.setStyle({ fillOpacity: stale ? 0.3 : 0.9, opacity: stale ? 0.3 : 1 })
    } else {
      const m = L.circleMarker([r.lat, r.lng], {
        radius: 9,
        color: "#fff",
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindTooltip(`${r.name ?? "Rider"}${r.role !== "MEMBER" ? ` · ${r.role.toLowerCase()}` : ""}`)
      markersRef.current.set(r.userId, m)
    }
    // Live route painting for pilot/sweep.
    if (r.role === "PILOT" || r.role === "SWEEP") {
      const t = trailsRef.current.get(r.userId)
      if (t) t.addLatLng([r.lat, r.lng])
      else {
        trailsRef.current.set(
          r.userId,
          L.polyline([[r.lat, r.lng]], { color, weight: 3, opacity: 0.8 }).addTo(map)
        )
      }
    }
  }, [])

  const applyRider = useCallback(
    (r: Rider) => {
      setRiders((prev) => {
        const next = new Map(prev)
        next.set(r.userId, r)
        return next
      })
      upsertMarker(r)
    },
    [upsertMarker]
  )

  // Initial state + polling fallback.
  const loadState = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/track`)
    if (!res.ok) return
    const data = await res.json()
    setStatus(data.status)
    const L = LRef.current
    const map = mapRef.current
    // Stored trails (pilot/sweep history before we joined).
    if (L && map) {
      for (const [userId, pts] of Object.entries(data.trails as Record<string, { lat: number; lng: number }[]>)) {
        if (pts.length < 2) continue
        const rider = (data.riders as Rider[]).find((r) => r.userId === userId)
        const color = ROLE_COLOR[rider?.role ?? "MEMBER"] ?? ROLE_COLOR.MEMBER
        const existing = trailsRef.current.get(userId)
        const latlngs = pts.map((p) => [p.lat, p.lng] as [number, number])
        if (existing) existing.setLatLngs(latlngs)
        else trailsRef.current.set(userId, L.polyline(latlngs, { color, weight: 3, opacity: 0.8 }).addTo(map))
      }
    }
    for (const r of data.riders as Rider[]) applyRider(r)
    // Fit once to whatever we know.
    if (!fittedRef.current && L && map) {
      const pts = (data.riders as Rider[]).map((r) => [r.lat, r.lng] as [number, number])
      const ap = data.assemblyPoint as { lat?: number; lng?: number } | null
      if (ap?.lat && ap?.lng) pts.push([ap.lat, ap.lng])
      if (pts.length > 0) {
        map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 14 })
        fittedRef.current = true
      }
    }
  }, [eventId, applyRider])

  // Mount the map.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import("leaflet")).default
      if (cancelled || !containerRef.current || mapRef.current) return
      LRef.current = L
      const map = L.map(containerRef.current).setView([20.59, 78.96], 5)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
      mapRef.current = map
      await loadState()
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current.clear()
      trailsRef.current.clear()
    }
  }, [loadState])

  // Realtime positions (or polling fallback).
  useEffect(() => {
    if (!realtime) {
      const t = setInterval(loadState, 8000)
      return () => clearInterval(t)
    }
    const client = new Ably.Realtime({ authUrl: "/api/realtime/token", echoMessages: false })
    const channel = client.channels.get(`event:${eventId}:track`)
    channel.subscribe("loc", (msg: Ably.InboundMessage) => applyRider(msg.data as Rider))
    const t = setInterval(loadState, 30000) // safety net
    return () => {
      clearInterval(t)
      client.close()
    }
  }, [realtime, eventId, loadState, applyRider])

  // ── Sharing my location ───────────────────────────────────────────────────

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setSharing(false)
  }, [])

  function startSharing() {
    if (!navigator.geolocation) {
      setGeoError("Location isn't supported on this device")
      return
    }
    setGeoError(null)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now()
        if (now - lastSentRef.current < 5000) return // throttle to ~1/5s
        lastSentRef.current = now
        const speedKmh = pos.coords.speed != null ? Math.max(0, pos.coords.speed * 3.6) : null
        fetch(`/api/events/${eventId}/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speedKmh,
          }),
        }).catch(() => {})
      },
      (err) => {
        setGeoError(err.message)
        stopSharing()
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    )
    setSharing(true)
  }

  useEffect(() => () => stopSharing(), [stopSharing])

  // ── Organizer ride controls ───────────────────────────────────────────────

  async function setRideStatus(next: "ACTIVE" | "COMPLETED") {
    setBusy(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        setStatus(next)
        if (next === "COMPLETED") stopSharing()
      }
    } finally {
      setBusy(false)
    }
  }

  async function sendSos() {
    setSosState("sent")
    const send = (lat?: number, lng?: number) =>
      fetch(`/api/events/${eventId}/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lat !== undefined ? { lat, lng } : {}),
      }).catch(() => {})
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => send(p.coords.latitude, p.coords.longitude),
        () => send(),
        { timeout: 5000, maximumAge: 60000 }
      )
    } else {
      send()
    }
    setTimeout(() => setSosState("idle"), 10000)
  }

  const live = status === "ACTIVE"
  const riderList = [...riders.values()].sort((a, b) => (a.role === "PILOT" ? -1 : b.role === "PILOT" ? 1 : 0))

  return (
    <div className="space-y-3">
      {/* Status / controls bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            live ? "bg-green-500/15 text-green-400" : "bg-zinc-800 text-zinc-400"
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", live ? "bg-green-500 animate-pulse" : "bg-zinc-600")} />
          {live ? "RIDE LIVE" : status === "COMPLETED" ? "Ride finished" : "Not started"}
        </span>
        <span className="text-xs text-zinc-500">{riderList.length} on map</span>

        <div className="ml-auto flex items-center gap-2">
          {isOrganizer && !live && status !== "COMPLETED" && (
            <Button size="sm" variant="glow" className="gap-1.5" disabled={busy} onClick={() => setRideStatus("ACTIVE")}>
              <Play className="h-3.5 w-3.5" /> Start ride
            </Button>
          )}
          {isOrganizer && live && (
            <Button size="sm" variant="outline" className="gap-1.5 border-red-500/30 text-red-400" disabled={busy} onClick={() => setRideStatus("COMPLETED")}>
              <Square className="h-3.5 w-3.5" /> End ride
            </Button>
          )}
          {live && (
            sharing ? (
              <Button size="sm" variant="outline" className="gap-1.5 border-green-500/40 text-green-400" onClick={stopSharing}>
                <LocateFixed className="h-3.5 w-3.5 animate-pulse" /> Sharing — stop
              </Button>
            ) : (
              <Button size="sm" variant="glow" className="gap-1.5" onClick={startSharing}>
                <LocateFixed className="h-3.5 w-3.5" /> Share my location
              </Button>
            )
          )}
        </div>
      </div>

      {geoError && <p className="text-xs text-red-400">{geoError}</p>}

      {/* Map */}
      <div ref={containerRef} className="h-[60vh] w-full rounded-2xl border border-zinc-800/50 overflow-hidden z-0" />

      {/* Legend + SOS */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
        {[["Pilot", ROLE_COLOR.PILOT], ["Sweep", ROLE_COLOR.SWEEP], ["Organizer", ROLE_COLOR.ORGANIZER], ["Rider", ROLE_COLOR.MEMBER]].map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color as string }} />
            {label}
          </span>
        ))}

        {live && (
          <span className="ml-auto">
            {sosState === "idle" && (
              <Button size="sm" variant="outline" className="gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={() => setSosState("confirm")}>
                <Siren className="h-3.5 w-3.5" /> SOS
              </Button>
            )}
            {sosState === "confirm" && (
              <span className="inline-flex items-center gap-2">
                <span className="text-red-400 font-medium">Alert the group?</span>
                <Button size="sm" variant="destructive" onClick={sendSos}>Yes, send SOS</Button>
                <Button size="sm" variant="ghost" onClick={() => setSosState("idle")}>Cancel</Button>
              </span>
            )}
            {sosState === "sent" && (
              <span className="text-red-400 font-medium inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> SOS sent — group & organizer alerted
              </span>
            )}
          </span>
        )}
      </div>

      {/* Rider list */}
      {riderList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {riderList.map((r) => (
            <button
              key={r.userId}
              onClick={() => mapRef.current?.setView([r.lat, r.lng], 15)}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-600"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ROLE_COLOR[r.role] ?? ROLE_COLOR.MEMBER }} />
              {r.name ?? "Rider"}
              {r.speedKmh != null && r.speedKmh > 1 && (
                <span className="text-zinc-500">{Math.round(r.speedKmh)} km/h</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
