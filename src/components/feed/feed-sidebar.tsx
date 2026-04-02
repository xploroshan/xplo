"use client"

import { CheckCircle2, TrendingUp, Calendar, Star } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { MockOrganizer, MockEvent } from "@/lib/mock-data"

function EventCountdown({ event }: { event: MockEvent }) {
  const d = new Date(event.startDate)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-orange-500" />
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Next Event</h4>
      </div>
      <p className="text-sm font-medium text-white mb-1">{event.title}</p>
      <div className="flex items-center gap-3 mt-2">
        <div className="text-center">
          <span className="text-xl font-bold text-orange-500">{days}</span>
          <p className="text-[10px] text-zinc-500">days</p>
        </div>
        <span className="text-zinc-600">:</span>
        <div className="text-center">
          <span className="text-xl font-bold text-orange-500">{hours}</span>
          <p className="text-[10px] text-zinc-500">hours</p>
        </div>
      </div>
    </div>
  )
}

export function FeedSidebar({
  organizers,
  nextEvent,
}: {
  organizers: MockOrganizer[]
  nextEvent?: MockEvent
}) {
  return (
    <div className="space-y-5">
      {/* Next Event Countdown */}
      {nextEvent && <EventCountdown event={nextEvent} />}

      {/* Suggested Organizers */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Suggested Organizers
        </h4>
        <div className="space-y-3">
          {organizers.map((org) => (
            <div key={org.id} className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-orange-500/10 text-orange-500 text-xs font-bold">
                  {org.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-white truncate">{org.name}</span>
                  {org.verified && <CheckCircle2 className="h-3 w-3 text-orange-500 shrink-0" />}
                </div>
                <span className="text-[11px] text-zinc-500">{org.followerCount} followers</span>
              </div>
              <Button
                variant="outline"
                className="h-6 px-2 text-[10px] rounded-full border-zinc-700 text-zinc-400"
              >
                Follow
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-orange-500" />
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trending</h4>
        </div>
        <div className="space-y-2">
          {["#DawnRide", "#WeekendTrek", "#BangaloreCycling", "#MonsoonRide", "#TrailRunning"].map((tag) => (
            <button
              key={tag}
              className="block text-sm text-orange-500 hover:text-orange-400 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
