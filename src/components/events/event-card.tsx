"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { MockEvent } from "@/lib/mock-data"

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    day: d.getDate(),
    weekday: d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
    month: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  }
}

export function EventCard({ event, index = 0 }: { event: MockEvent; index?: number }) {
  const date = formatDate(event.startDate)
  const spotsLeft = event.capacity - event.registeredCount
  const isFull = spotsLeft <= 0
  const capacityPercent = Math.min((event.registeredCount / event.capacity) * 100, 100)
  const priceDisplay = event.price > 0 ? `₹${event.price.toLocaleString()}` : "Free"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/events/${event.slug}`} className="block group">
        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20 group-hover:-translate-y-1">
          {/* Cover Image / Gradient Fallback */}
          <div
            className="relative aspect-[16/10] overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${event.eventType.color}15 0%, ${event.eventType.color}05 50%, transparent 100%)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div
                className="w-32 h-32 rounded-full blur-2xl"
                style={{ backgroundColor: event.eventType.color }}
              />
            </div>

            {/* Type Badge */}
            <div className="absolute top-3 left-3">
              <Badge
                className="text-xs font-medium border-0 backdrop-blur-sm"
                style={{
                  backgroundColor: `${event.eventType.color}20`,
                  color: event.eventType.color,
                }}
              >
                {event.eventType.name}
              </Badge>
            </div>

            {/* Price Badge */}
            <div className="absolute top-3 right-3">
              <Badge className={`text-xs font-semibold border-0 backdrop-blur-sm ${
                event.price > 0
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-green-500/20 text-green-400"
              }`}>
                {priceDisplay}
              </Badge>
            </div>

            {/* Date Block */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="flex flex-col items-center bg-zinc-950/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-zinc-700/50">
                <span className="text-[10px] font-semibold text-orange-500">{date.weekday}</span>
                <span className="text-lg font-bold text-white leading-none">{date.day}</span>
                <span className="text-[10px] text-zinc-400">{date.month}</span>
              </div>
              <span className="text-xs text-zinc-300 bg-zinc-950/60 backdrop-blur-sm rounded-md px-2 py-1">
                {date.time}
              </span>
            </div>

            {/* Featured Indicator */}
            {event.featured && (
              <div className="absolute bottom-3 right-3">
                <Badge className="bg-orange-500/90 text-white text-[10px] border-0">
                  Featured
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-base font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-1 mb-1.5">
              {event.title}
            </h3>

            <div className="flex items-center gap-1.5 text-sm text-zinc-400 mb-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="truncate">{event.destination.address}</span>
            </div>
            {"city" in event && (event as unknown as { city: string }).city && (
              <div className="text-[11px] text-zinc-500 mb-2 ml-5">
                From {(event as unknown as { city: string }).city}
              </div>
            )}

            {/* Organizer + Participants Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback
                    className="text-[9px] font-bold"
                    style={{
                      backgroundColor: `${event.eventType.color}15`,
                      color: event.eventType.color,
                    }}
                  >
                    {event.organizer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-zinc-400">{event.organizer.name}</span>
              </div>

              {/* Participant Avatars Stack */}
              <div className="flex items-center">
                {event.participants.slice(0, 3).map((p, i) => (
                  <Avatar
                    key={p.id}
                    className="h-6 w-6 border-2 border-zinc-900"
                    style={{ marginLeft: i > 0 ? "-8px" : "0" }}
                  >
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[9px]">
                      {p.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {event.registeredCount > 3 && (
                  <span className="ml-1 text-[11px] text-zinc-500">
                    +{event.registeredCount - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Capacity Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.registeredCount}/{event.capacity}
                </span>
                <span className={isFull ? "text-red-400 font-medium" : "text-zinc-500"}>
                  {isFull ? "Full" : `${spotsLeft} spots left`}
                </span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${capacityPercent}%`,
                    backgroundColor: isFull ? "#ef4444" : event.eventType.color,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
