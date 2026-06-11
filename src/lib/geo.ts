/**
 * Geo math for live tracking and post-ride summaries.
 */

export interface TrailPoint {
  lat: number
  lng: number
  recordedAt: Date | string
}

const EARTH_RADIUS_KM = 6371

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export interface RouteSummary {
  distanceKm: number
  durationMin: number
  avgSpeedKmh: number
  maxSpeedKmh: number
  points: number
}

/**
 * Summarize a chronological GPS trail. Jumps > 2km between consecutive samples
 * are treated as GPS glitches and skipped so one bad fix can't add 50 km.
 */
export function summarizeTrail(points: TrailPoint[]): RouteSummary | null {
  if (points.length < 2) return null

  const sorted = [...points].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  )

  let distanceKm = 0
  let maxSpeedKmh = 0
  for (let i = 1; i < sorted.length; i++) {
    const leg = haversineKm(sorted[i - 1], sorted[i])
    if (leg > 2) continue // glitch guard
    distanceKm += leg
    const dtH =
      (new Date(sorted[i].recordedAt).getTime() - new Date(sorted[i - 1].recordedAt).getTime()) /
      3_600_000
    if (dtH > 0) maxSpeedKmh = Math.max(maxSpeedKmh, leg / dtH)
  }

  const durationMin =
    (new Date(sorted[sorted.length - 1].recordedAt).getTime() -
      new Date(sorted[0].recordedAt).getTime()) /
    60_000
  if (durationMin <= 0 || distanceKm <= 0) return null

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin: Math.round(durationMin),
    avgSpeedKmh: Math.round((distanceKm / (durationMin / 60)) * 10) / 10,
    maxSpeedKmh: Math.round(Math.min(maxSpeedKmh, 200) * 10) / 10,
    points: sorted.length,
  }
}
