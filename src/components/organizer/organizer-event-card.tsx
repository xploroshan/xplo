"use client"

import { useState } from "react"
import { Calendar, MapPin, Users, Flame, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { EventRegisterButton } from "./event-register-button"
import { FollowButton } from "./follow-button"

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
  organizerId: string
  organizerName: string | null
  isFollowing: boolean
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
  organizerId,
  organizerName,
  isFollowing,
}: EventCardProps) {
  // Show a one-time "follow for updates" nudge right after a fresh registration —
  // the come-back hook that turns a one-off rider into a returning follower.
  const [showFollowNudge, setShowFollowNudge] = useState(false)

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

  const destinationAddress = event.destination?.address || "Location TBD"

  const capacityPercent =
    event.capacity && event.capacity > 0
      ? Math.min((event.registeredCount / event.capacity) * 100, 100)
      : 0

  const isFull = event.capacity ? event.registeredCount >= event.capacity : false
  const spotsLeft = event.capacity ? Math.max(event.capacity - event.registeredCount, 0) : null
  // "Scarce" = within the last few spots (min 3, or 15% of capacity).
  const scarce =
    spotsLeft != null &&
    spotsLeft > 0 &&
    event.capacity != null &&
    spotsLeft <= Math.max(3, Math.ceil(event.capacity * 0.15))

  const priceDisplay =
    event.price && Number(event.price) > 0
      ? `${event.currency} ${Number(event.price).toLocaleString()}`
      : "Free"

  function handleRegisteredChange(registered: boolean) {
    // Only nudge people who aren't already following and just opted in.
    setShowFollowNudge(registered && !isFollowing && isAuthenticated)
  }

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

      {/* Social proof + scarcity */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-zinc-400 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {event.registeredCount > 0 ? `${event.registeredCount} going` : "Be the first to join"}
            {event.capacity ? ` · ${event.capacity} spots` : ""}
          </span>
          {isFull ? (
            <span className="text-red-400 font-medium">Full</span>
          ) : scarce ? (
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <Flame className="h-3 w-3" />
              Only {spotsLeft} left
            </span>
          ) : null}
        </div>
        {event.capacity && (
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${capacityPercent}%`,
                backgroundColor: isFull ? "#ef4444" : scarce ? "#f59e0b" : event.eventType.color,
              }}
            />
          </div>
        )}
      </div>

      {/* Register */}
      <EventRegisterButton
        eventId={event.id}
        isRegistered={isRegistered}
        isAuthenticated={isAuthenticated}
        isFull={isFull}
        organizerSlug={organizerSlug}
        onRegisteredChange={handleRegisteredChange}
      />

      {/* Come-back hook: nudge a fresh registrant to follow for updates */}
      {showFollowNudge && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2">
          <span className="text-xs text-zinc-300 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-orange-400 shrink-0" />
            Get updates on {organizerName ? `${organizerName}'s` : "the"} next ride
          </span>
          <FollowButton
            organizerId={organizerId}
            initialFollowing={false}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}
    </div>
  )
}
