"use client"

import { Calendar, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EventRegisterButton } from "./event-register-button"

interface EventCardProps {
  event: {
    id: string
    title: string
    slug: string
    startDate: Date
    endDate: Date | null
    destination: { lat?: number; lng?: number; address?: string } | null
    capacity: number | null
    coverImage: string | null
    status: string
    price: unknown
    currency: string
    registeredCount: number
    eventType: { name: string; color: string; icon: string }
  }
  isRegistered: boolean
  isAuthenticated: boolean
  organizerSlug: string
}

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  OPEN: "bg-green-500/10 text-green-400 border-green-500/20",
  ACTIVE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CLOSED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

export function OrganizerEventCard({
  event,
  isRegistered,
  isAuthenticated,
  organizerSlug,
}: EventCardProps) {
  const date = new Date(event.startDate)
  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const destinationAddress =
    event.destination?.address || "Location TBD"

  const capacityPercent =
    event.capacity && event.capacity > 0
      ? Math.min((event.registeredCount / event.capacity) * 100, 100)
      : 0

  const isFull = event.capacity ? event.registeredCount >= event.capacity : false
  const priceDisplay =
    event.price && Number(event.price) > 0
      ? `${event.currency} ${Number(event.price).toLocaleString()}`
      : "Free"

  return (
    <div
      className="rounded-xl border bg-zinc-900/50 p-5 transition-all hover:border-zinc-700"
      style={{ borderColor: `${event.eventType.color}20` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{event.title}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs border-zinc-700"
              style={{ color: event.eventType.color }}
            >
              {event.eventType.name}
            </Badge>
            <Badge variant="outline" className={`text-xs ${statusColors[event.status] || ""}`}>
              {event.status}
            </Badge>
            {priceDisplay !== "Free" && (
              <span className="text-xs text-amber-500 font-medium">{priceDisplay}</span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Calendar className="h-4 w-4 shrink-0 text-zinc-500" />
          <span>{formattedDate} at {formattedTime}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <MapPin className="h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate">{destinationAddress}</span>
        </div>
      </div>

      {/* Capacity Bar */}
      {event.capacity && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-zinc-400 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.registeredCount} / {event.capacity} registered
            </span>
            {isFull && <span className="text-red-400 font-medium">Full</span>}
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${capacityPercent}%`,
                backgroundColor: isFull ? "#ef4444" : event.eventType.color,
              }}
            />
          </div>
        </div>
      )}

      {/* Register Button */}
      <EventRegisterButton
        eventId={event.id}
        isRegistered={isRegistered}
        isAuthenticated={isAuthenticated}
        isFull={isFull}
        organizerSlug={organizerSlug}
      />
    </div>
  )
}
