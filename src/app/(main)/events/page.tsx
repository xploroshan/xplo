"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Building2, MapPin, TrendingUp, Compass } from "lucide-react"
import { SmartFilterBar } from "@/components/events/smart-filter-bar"
import { FeaturedCarousel } from "@/components/events/featured-carousel"
import { UpcomingRow } from "@/components/events/upcoming-row"
import { EventCard } from "@/components/events/event-card"
import { PopularOrganizers } from "@/components/events/popular-organizers"
import { RecommendedEvents } from "@/components/events/recommended-events"
import { MOCK_EVENTS, MOCK_ORGANIZERS } from "@/lib/mock-data"
import { getDestinationsFromEvents } from "@/lib/locations"
import { useUIStore } from "@/stores/ui-store"

export default function EventsPage() {
  const { filters } = useUIStore()

  const featuredEvents = MOCK_EVENTS.filter((e) => e.featured)
  const availableDestinations = useMemo(() => getDestinationsFromEvents(MOCK_EVENTS), [])

  const weekendEvents = useMemo(() => {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return MOCK_EVENTS.filter((e) => {
      const d = new Date(e.startDate)
      return d >= now && d <= weekFromNow
    })
  }, [])

  const filteredEvents = useMemo(() => {
    let events = [...MOCK_EVENTS]

    // City filter — match start city
    if (filters.city) {
      events = events.filter((e) => e.city.toLowerCase() === filters.city!.toLowerCase())
    }

    // Event type filter
    if (filters.eventType) {
      events = events.filter((e) => e.eventType.slug === filters.eventType)
    }

    // Destination filter — match destination city
    if (filters.destination) {
      events = events.filter((e) =>
        e.destination.city?.toLowerCase() === filters.destination!.toLowerCase()
      )
    }

    // Date range filter
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom)
      from.setHours(0, 0, 0, 0)
      events = events.filter((e) => new Date(e.startDate) >= from)
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo)
      to.setHours(23, 59, 59, 999)
      events = events.filter((e) => new Date(e.startDate) <= to)
    }

    // Search query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase()
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.organizer.name.toLowerCase().includes(q) ||
          e.startLocation.address.toLowerCase().includes(q) ||
          e.destination.address.toLowerCase().includes(q)
      )
    }

    // Sort
    if (filters.sortBy === "rating") {
      events.sort((a, b) => (b.organizer.rating || 0) - (a.organizer.rating || 0))
    } else if (filters.sortBy === "popularity") {
      events.sort((a, b) => b.registeredCount - a.registeredCount)
    } else {
      events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    }

    return events
  }, [filters])

  const hasActiveFilters = filters.city || filters.dateFrom || filters.eventType || filters.destination || filters.searchQuery
  const showDiscovery = !hasActiveFilters

  // City stats for the hero area
  const cityEventCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    MOCK_EVENTS.forEach((e) => {
      counts[e.city] = (counts[e.city] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-2 pt-2 pb-3"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Discover Adventures Near You
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
          Find events by city, date, activity type, and destination
        </p>
      </motion.div>

      {/* Smart Filter Bar */}
      <SmartFilterBar
        availableDestinations={availableDestinations}
        totalResults={filteredEvents.length}
      />

      {/* Quick City Chips (shown when no city selected) */}
      {!filters.city && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          <span className="text-xs text-zinc-500 shrink-0 mr-1">Popular:</span>
          {cityEventCounts.map(([city, count]) => (
            <QuickCityChip key={city} city={city} count={count} />
          ))}
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Featured Carousel — show in discovery mode */}
          {showDiscovery && featuredEvents.length > 0 && (
            <FeaturedCarousel events={featuredEvents} />
          )}

          {/* This Weekend Row — show in discovery mode */}
          {showDiscovery && weekendEvents.length > 0 && (
            <UpcomingRow events={weekendEvents} title="Happening This Week" />
          )}

          {/* AI Recommended — show in discovery mode */}
          {showDiscovery && <RecommendedEvents />}

          {/* Filtered / All Events */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">
                  {hasActiveFilters ? "Matching Events" : "All Events"}
                </h2>
                {filters.city && (
                  <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                    <MapPin className="h-3 w-3" />
                    {filters.city}
                  </span>
                )}
              </div>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredEvents.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 shrink-0 space-y-6">
          {/* City Quick Stats */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Compass className="h-4 w-4 text-orange-500" />
              Events by City
            </h3>
            <div className="space-y-2">
              {cityEventCounts.map(([city, count]) => (
                <CityStatRow key={city} city={city} count={count} />
              ))}
            </div>
          </div>

          <PopularOrganizers organizers={MOCK_ORGANIZERS.slice(0, 5)} />

          <Link
            href="/organizations"
            className="flex items-center gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5 hover:border-orange-500/30 transition-colors group"
          >
            <Building2 className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="text-sm font-semibold text-white">Organizations</h3>
              <p className="text-xs text-zinc-500">Browse verified org profiles</p>
            </div>
          </Link>

          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Platform Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Active Events</span>
                <span className="text-sm font-semibold text-white">{MOCK_EVENTS.filter(e => e.status === "OPEN").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Organizers</span>
                <span className="text-sm font-semibold text-white">{MOCK_ORGANIZERS.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Community</span>
                <span className="text-sm font-semibold text-white">2,400+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickCityChip({ city, count }: { city: string; count: number }) {
  const setCity = useUIStore((s) => s.setCity)
  const activeCity = useUIStore((s) => s.filters.city)

  return (
    <button
      onClick={() => setCity(activeCity === city ? null : city)}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        activeCity === city
          ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
          : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
      }`}
    >
      <MapPin className="h-3 w-3" />
      {city}
      <span className="text-[10px] opacity-60">{count}</span>
    </button>
  )
}

function CityStatRow({ city, count }: { city: string; count: number }) {
  const setCity = useUIStore((s) => s.setCity)

  return (
    <button
      onClick={() => setCity(city)}
      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors group text-left"
    >
      <span className="flex items-center gap-2 text-sm text-zinc-400 group-hover:text-white transition-colors">
        <MapPin className="h-3 w-3 text-zinc-600" />
        {city}
      </span>
      <span className="text-xs text-zinc-500 font-medium">{count}</span>
    </button>
  )
}

function EmptyState() {
  const resetFilters = useUIStore((s) => s.resetFilters)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
        <Compass className="h-8 w-8 text-zinc-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
      <p className="text-sm text-zinc-400 mb-4 max-w-sm mx-auto">
        Try adjusting your filters or explore events in a different city
      </p>
      <button
        onClick={resetFilters}
        className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
      >
        Clear All Filters
      </button>
    </motion.div>
  )
}
