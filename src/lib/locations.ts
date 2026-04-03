// Location data for smart filtering

export interface City {
  name: string
  state: string
  country: string
  popular: boolean
}

export const INDIA_CITIES: City[] = [
  { name: "Bangalore", state: "Karnataka", country: "India", popular: true },
  { name: "Mumbai", state: "Maharashtra", country: "India", popular: true },
  { name: "Delhi", state: "Delhi", country: "India", popular: true },
  { name: "Chennai", state: "Tamil Nadu", country: "India", popular: true },
  { name: "Hyderabad", state: "Telangana", country: "India", popular: true },
  { name: "Pune", state: "Maharashtra", country: "India", popular: true },
  { name: "Goa", state: "Goa", country: "India", popular: true },
  { name: "Mysore", state: "Karnataka", country: "India", popular: false },
  { name: "Coorg", state: "Karnataka", country: "India", popular: false },
  { name: "Gokarna", state: "Karnataka", country: "India", popular: false },
  { name: "Chikmagalur", state: "Karnataka", country: "India", popular: false },
  { name: "Pondicherry", state: "Puducherry", country: "India", popular: false },
  { name: "Jaipur", state: "Rajasthan", country: "India", popular: true },
  { name: "Udaipur", state: "Rajasthan", country: "India", popular: false },
  { name: "Kochi", state: "Kerala", country: "India", popular: false },
  { name: "Manali", state: "Himachal Pradesh", country: "India", popular: true },
  { name: "Rishikesh", state: "Uttarakhand", country: "India", popular: true },
  { name: "Leh", state: "Ladakh", country: "India", popular: false },
  { name: "Shimla", state: "Himachal Pradesh", country: "India", popular: false },
  { name: "Dehradun", state: "Uttarakhand", country: "India", popular: false },
]

export const COUNTRIES = ["India"] as const

export function getCitiesForCountry(country: string): City[] {
  if (country === "India") return INDIA_CITIES
  return []
}

export function getPopularCities(country: string): City[] {
  return getCitiesForCountry(country).filter((c) => c.popular)
}

export function getDestinationsFromEvents(events: { destination: { city?: string } }[]): string[] {
  const destinations = new Set<string>()
  events.forEach((e) => {
    if (e.destination.city) destinations.add(e.destination.city)
  })
  return Array.from(destinations).sort()
}
