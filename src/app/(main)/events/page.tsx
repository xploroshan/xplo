"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Search, SlidersHorizontal } from "lucide-react"
import { FeaturedCarousel } from "@/components/events/featured-carousel"
import { CategoryFilter } from "@/components/events/category-filter"
import { UpcomingRow } from "@/components/events/upcoming-row"
import { EventCard } from "@/components/events/event-card"
import { PopularOrganizers } from "@/components/events/popular-organizers"
import { MOCK_EVENTS, MOCK_ORGANIZERS } from "@/lib/mock-data"
import { useUIStore } from "@/stores/ui-store"

export default function EventsPage() {
  const { activeCategory } = useUIStore()

  const featuredEvents = MOCK_EVENTS.filter((e) => e.featured)

  const weekendEvents = useMemo(() => {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return MOCK_EVENTS.filter((e) => {
      const d = new Date(e.startDate)
      return d >= now && d <= weekFromNow
    })
  }, [])

  const filteredEvents = useMemo(() => {
    if (!activeCategory) return MOCK_EVENTS
    return MOCK_EVENTS.filter((e) => e.eventType.slug === activeCategory)
  }, [activeCategory])

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    MOCK_EVENTS.forEach((e) => {
      counts[e.eventType.slug] = (counts[e.eventType.slug] || 0) + 1
    })
    return counts
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 flex items-center gap-3 rounded-xl bg-zinc-900/50 border border-zinc-800 px-4 py-3">
              <Search className="h-5 w-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search events, organizers, locations..."
                className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-full"
              />
            </div>
            <button className="p-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </motion.div>

          {/* Featured Carousel */}
          <FeaturedCarousel events={featuredEvents} />

          {/* Category Filter */}
          <CategoryFilter eventCounts={eventCounts} />

          {/* This Weekend Row */}
          {weekendEvents.length > 0 && !activeCategory && (
            <UpcomingRow events={weekendEvents} title="Happening This Week" />
          )}

          {/* Main Event Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {activeCategory
                  ? `${MOCK_EVENTS.find((e) => e.eventType.slug === activeCategory)?.eventType.name || "Events"}`
                  : "All Events"}
              </h2>
              <span className="text-sm text-zinc-500">
                {filteredEvents.length} events
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredEvents.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          </section>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 shrink-0 space-y-6">
          <PopularOrganizers organizers={MOCK_ORGANIZERS.slice(0, 5)} />

          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Platform Stats</h3>
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
