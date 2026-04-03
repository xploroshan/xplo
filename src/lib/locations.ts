// Re-exports from comprehensive world databases
// Kept for backward compatibility with events page

export { type WorldCity as City, searchCities, getNearbyCities, WORLD_CITIES } from "./world-cities"
export { type WorldDestination, searchDestinations, getPopularDestinations, getNearbyDestinations } from "./world-destinations"

/** Extract unique destination cities from events (for "active events" section in destination dropdown) */
export function getDestinationsFromEvents(events: { destination: { city?: string } }[]): string[] {
  const destinations = new Set<string>()
  events.forEach((e) => {
    if (e.destination.city) destinations.add(e.destination.city)
  })
  return Array.from(destinations).sort()
}
