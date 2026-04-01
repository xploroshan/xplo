import { Calendar, Users, MapPin, Route } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PastEventCardProps {
  event: {
    id: string
    title: string
    startDate: Date
    destination: { lat?: number; lng?: number; address?: string } | null
    coverImage: string | null
    registeredCount: number
    routeSummary: { distance?: string; duration?: string } | null
    eventType: { name: string; color: string; icon: string }
  }
}

export function OrganizerPastEventCard({ event }: PastEventCardProps) {
  const date = new Date(event.startDate)
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const destinationAddress = event.destination?.address || "—"

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700">
      <div className="flex items-start gap-4">
        {event.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImage}
            alt={event.title}
            className="h-20 w-20 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div
            className="h-20 w-20 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: `${event.eventType.color}15` }}
          >
            <Route className="h-8 w-8" style={{ color: event.eventType.color }} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white truncate">{event.title}</h3>
          <Badge
            variant="outline"
            className="text-xs border-zinc-700 mt-1"
            style={{ color: event.eventType.color }}
          >
            {event.eventType.name}
          </Badge>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {event.registeredCount} joined
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {destinationAddress}
            </span>
          </div>

          {event.routeSummary && (
            <div className="flex gap-3 mt-2 text-xs text-zinc-600">
              {event.routeSummary.distance && (
                <span>{event.routeSummary.distance}</span>
              )}
              {event.routeSummary.duration && (
                <span>{event.routeSummary.duration}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
