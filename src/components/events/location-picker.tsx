"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"
import type * as Leaflet from "leaflet"
import { MapPin, Loader2, Crosshair } from "lucide-react"
import { Input } from "@/components/ui/input"
import { geocode, reverseAddress } from "@/lib/geocode"

interface LocationPickerProps {
  /** Base field name; emits `${name}`, `${name}Lat`, `${name}Lng` as hidden inputs. */
  name: string
  label: string
  placeholder?: string
}

/**
 * Address text + click-to-pin map. Writes the chosen address and lat/lng into
 * hidden inputs so the existing FormData submit keeps working; lat/lng let the
 * server skip geocoding. Leaflet is loaded client-side only (touches window).
 */
export function LocationPicker({ name, label, placeholder }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const markerRef = useRef<Leaflet.Marker | null>(null)
  const LRef = useRef<typeof Leaflet | null>(null)

  const [address, setAddress] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  function place(la: number, ln: number) {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return
    setLat(String(la))
    setLng(String(ln))
    if (markerRef.current) markerRef.current.setLatLng([la, ln])
    else markerRef.current = L.marker([la, ln]).addTo(map)
    map.setView([la, ln], Math.max(map.getZoom(), 13))
  }

  // Mount the map when the picker is opened.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      const L = (await import("leaflet")).default
      if (cancelled || !containerRef.current || mapRef.current) return
      LRef.current = L
      const map = L.map(containerRef.current).setView([20.59, 78.96], 4)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
      map.on("click", async (e: Leaflet.LeafletMouseEvent) => {
        place(e.latlng.lat, e.latlng.lng)
        setBusy(true)
        const addr = await reverseAddress(e.latlng.lat, e.latlng.lng)
        if (!cancelled && addr) setAddress(addr)
        setBusy(false)
      })
      mapRef.current = map
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [open])

  async function locateFromText() {
    if (!address.trim()) return
    setBusy(true)
    const p = await geocode(address.trim())
    if (p) {
      setOpen(true)
      // Wait a tick for the map to mount, then drop the pin.
      requestAnimationFrame(() => place(p.lat, p.lng))
    }
    setBusy(false)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex gap-2">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={placeholder}
          className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
        />
        <button
          type="button"
          onClick={locateFromText}
          title="Find on map"
          className="shrink-0 inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-zinc-300 hover:text-white hover:border-zinc-600"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-xs text-zinc-300 hover:text-white hover:border-zinc-600"
        >
          <MapPin className="h-3.5 w-3.5" />
          {open ? "Hide map" : "Pick on map"}
        </button>
      </div>

      {open && (
        <>
          <p className="text-[11px] text-zinc-500">Tap the map to drop a pin — we&apos;ll fill in the address.</p>
          <div ref={containerRef} className="h-56 w-full rounded-xl border border-zinc-800 overflow-hidden z-0" />
        </>
      )}

      {/* Submitted via FormData. */}
      <input type="hidden" name={name} value={address} readOnly />
      <input type="hidden" name={`${name}Lat`} value={lat} readOnly />
      <input type="hidden" name={`${name}Lng`} value={lng} readOnly />
    </div>
  )
}
