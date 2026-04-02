"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { EventCardCompact } from "./event-card-compact"
import type { MockEvent } from "@/lib/mock-data"

export function UpcomingRow({ events, title }: { events: MockEvent[]; title: string }) {
  if (events.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button className="flex items-center gap-1 text-sm text-zinc-400 hover:text-orange-500 transition-colors">
          View all
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {events.map((event) => (
          <EventCardCompact key={event.id} event={event} />
        ))}
      </div>
    </motion.section>
  )
}
