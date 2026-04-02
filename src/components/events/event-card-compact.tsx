"use client"

import Link from "next/link"
import { MapPin, Users } from "lucide-react"
import type { MockEvent } from "@/lib/mock-data"

export function EventCardCompact({ event }: { event: MockEvent }) {
  const d = new Date(event.startDate)
  const weekday = d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase()
  const dayNum = d.getDate()
  const month = d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
  const spotsLeft = event.capacity - event.registeredCount

  return (
    <Link href={`/events/${event.slug}`} className="block shrink-0 w-[280px] group">
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden transition-all hover:border-zinc-700 group-hover:-translate-y-0.5">
        {/* Cover */}
        <div
          className="relative h-28 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${event.eventType.color}20 0%, ${event.eventType.color}05 100%)`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div
              className="w-24 h-24 rounded-full blur-2xl"
              style={{ backgroundColor: event.eventType.color }}
            />
          </div>

          {/* Date Overlay */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-zinc-950/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-zinc-700/50">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-semibold text-orange-500">{weekday}</span>
              <span className="text-sm font-bold text-white leading-none">{dayNum}</span>
              <span className="text-[9px] text-zinc-400">{month}</span>
            </div>
          </div>

          {/* Type */}
          <div
            className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm"
            style={{
              backgroundColor: `${event.eventType.color}20`,
              color: event.eventType.color,
            }}
          >
            {event.eventType.name}
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h4 className="text-sm font-semibold text-white line-clamp-1 mb-1 group-hover:text-orange-400 transition-colors">
            {event.title}
          </h4>
          <div className="flex items-center gap-1 text-xs text-zinc-500 mb-2">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{event.destination.address}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-zinc-400">
              <Users className="h-3 w-3" />
              {event.registeredCount}/{event.capacity}
            </span>
            <span className={spotsLeft <= 3 ? "text-orange-400 font-medium" : "text-zinc-500"}>
              {spotsLeft <= 0 ? "Full" : `${spotsLeft} left`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
