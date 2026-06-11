"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CalendarEvent {
  slug: string
  title: string
  date: string // ISO
  color?: string
  role: "going" | "organizing"
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Month calendar of events the user is going to or organizing.
export function EventCalendar({ events }: { events: CalendarEvent[] }) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  // Bucket events by local YYYY-MM-DD.
  const byDay = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const k = ymd(new Date(e.date))
    const arr = byDay.get(k) ?? []
    arr.push(e)
    byDay.set(k, arr)
  }

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="h-8 w-8 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="h-8 px-3 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white"
          >
            Today
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="h-8 w-8 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[11px] font-medium text-zinc-500 py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="aspect-square" />
          const key = ymd(date)
          const dayEvents = byDay.get(key) ?? []
          const isToday = key === ymd(today)
          return (
            <div
              key={key}
              className={cn(
                "aspect-square rounded-lg border p-1 overflow-hidden",
                isToday ? "border-orange-500/50 bg-orange-500/5" : "border-zinc-800/50 bg-zinc-900/30"
              )}
            >
              <div className={cn("text-[11px] mb-0.5", isToday ? "text-orange-400 font-bold" : "text-zinc-500")}>
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <Link
                    key={e.slug}
                    href={`/events/${e.slug}`}
                    title={e.title}
                    className="block truncate rounded px-1 text-[10px] leading-tight text-white"
                    style={{ backgroundColor: `${e.color ?? "#f97316"}33` }}
                  >
                    {e.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-zinc-500">+{dayEvents.length - 3}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {events.length === 0 && (
        <p className="text-center text-sm text-zinc-500 mt-6">
          No upcoming events on your calendar yet. Join a ride and it&apos;ll show up here.
        </p>
      )}
    </div>
  )
}
