"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { MockEvent } from "@/lib/mock-data"

export function FeaturedCarousel({ events }: { events: MockEvent[] }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % events.length)
  }, [events.length])

  const prev = () => {
    setCurrent((c) => (c - 1 + events.length) % events.length)
  }

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  if (events.length === 0) return null
  const event = events[current]
  const d = new Date(event.startDate)
  const dateStr = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
  const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  const spotsLeft = event.capacity - event.registeredCount

  return (
    <div className="relative rounded-2xl overflow-hidden border border-zinc-800/50">
      <AnimatePresence mode="wait">
        <motion.div
          key={event.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative h-[280px] sm:h-[320px]"
          style={{
            background: `linear-gradient(135deg, ${event.eventType.color}18 0%, ${event.eventType.color}08 40%, #09090b 100%)`,
          }}
        >
          {/* Background glow */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20"
            style={{ backgroundColor: event.eventType.color }}
          />

          <div className="relative z-10 flex flex-col justify-end h-full p-6 sm:p-8">
            <Badge
              className="w-fit text-xs font-medium border-0 mb-3"
              style={{
                backgroundColor: `${event.eventType.color}20`,
                color: event.eventType.color,
              }}
            >
              {event.eventType.name}
            </Badge>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {event.title}
            </h2>

            <p className="text-sm text-zinc-400 line-clamp-2 max-w-xl mb-4">
              {event.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300 mb-5">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-500" />
                {dateStr} at {timeStr}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-zinc-500" />
                {event.destination.address}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/events/${event.slug}`}>
                <Button variant="glow" className="rounded-xl px-6">
                  {spotsLeft <= 0 ? "View Details" : `Join — ${spotsLeft} spots left`}
                </Button>
              </Link>
              {event.price > 0 && (
                <span className="text-sm font-medium text-amber-400">
                  ₹{event.price.toLocaleString()}
                </span>
              )}
              {event.price === 0 && (
                <span className="text-sm font-medium text-green-400">Free</span>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-zinc-900/60 backdrop-blur-sm border border-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-zinc-900/60 backdrop-blur-sm border border-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 right-6 z-20 flex items-center gap-1.5">
        {events.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-6 bg-orange-500" : "w-1.5 bg-zinc-600"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
