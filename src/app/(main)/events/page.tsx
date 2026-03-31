import { Search, Filter, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { DEFAULT_EVENT_TYPES } from "@/lib/constants"

export const metadata = { title: "Explore Events" }

export default function EventsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Explore Events</h1>
          <p className="text-zinc-400 mt-1 flex items-center gap-1">
            <MapPin className="h-4 w-4" /> Bangalore, India
          </p>
        </div>
        <Link href="/events/create">
          <Button variant="glow" className="rounded-xl">
            Create Event
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search events, destinations, organizers..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl border-zinc-700 text-zinc-300">
          <Filter className="h-4 w-4 mr-2" /> Filters
        </Button>
      </div>

      {/* Event Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1.5 rounded-full cursor-pointer whitespace-nowrap">
          All Events
        </Badge>
        {DEFAULT_EVENT_TYPES.map((type) => (
          <Badge
            key={type.slug}
            variant="outline"
            className="border-zinc-700 text-zinc-400 px-4 py-1.5 rounded-full cursor-pointer whitespace-nowrap hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {type.name}
          </Badge>
        ))}
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6">
          <Search className="h-8 w-8 text-zinc-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
        <p className="text-zinc-500 max-w-sm mb-6">
          Be the first to create an event in your city. Organize a ride, trek, or group trip!
        </p>
        <Link href="/events/create">
          <Button variant="glow" className="rounded-xl">
            Create the First Event
          </Button>
        </Link>
      </div>
    </div>
  )
}
