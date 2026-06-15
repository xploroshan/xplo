/**
 * Client-side address → lat/lng via Nominatim (OpenStreetMap), cached in
 * sessionStorage. Nominatim's usage policy asks for restraint, so callers
 * should cap how many they geocode and the cache keeps repeats free.
 */
export interface LatLng {
  lat: number
  lng: number
}

export async function geocode(address: string): Promise<LatLng | null> {
  if (!address) return null
  const key = `geo:${address}`
  try {
    const cached = sessionStorage.getItem(key)
    if (cached) return JSON.parse(cached)
  } catch {
    // sessionStorage unavailable — fall through
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { Accept: "application/json" } }
    )
    const data = await res.json()
    if (!Array.isArray(data) || !data[0]) return null
    const point: LatLng = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    try {
      sessionStorage.setItem(key, JSON.stringify(point))
    } catch {
      // best-effort
    }
    return point
  } catch {
    return null
  }
}

/** Reverse-geocode a coordinate to a full display address. */
export async function reverseAddress(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=16&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } }
    )
    const data = await res.json()
    return data?.display_name ?? null
  } catch {
    return null
  }
}

/** Reverse-geocode a coordinate to a city/town name. */
export async function reverseCity(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } }
    )
    const data = await res.json()
    const a = data?.address ?? {}
    return a.city || a.town || a.state_district || a.county || a.state || null
  } catch {
    return null
  }
}
