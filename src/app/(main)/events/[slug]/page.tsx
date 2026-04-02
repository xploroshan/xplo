"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Shield,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EventCard } from "@/components/events/event-card"
import { MOCK_EVENTS } from "@/lib/mock-data"

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const event = MOCK_EVENTS.find((e) => e.slug === slug)

  if (!event) notFound()

  const d = new Date(event.startDate)
  const dateStr = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  const spotsLeft = event.capacity - event.registeredCount
  const isFull = spotsLeft <= 0
  const capacityPercent = Math.min((event.registeredCount / event.capacity) * 100, 100)
  const priceDisplay = event.price > 0 ? `₹${event.price.toLocaleString()}` : "Free"

  const similarEvents = MOCK_EVENTS
    .filter((e) => e.eventType.slug === event.eventType.slug && e.id !== event.id)
    .slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Back */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-zinc-800/50 mb-8"
      >
        <div
          className="relative h-[240px] sm:h-[320px]"
          style={{
            background: `linear-gradient(135deg, ${event.eventType.color}20 0%, ${event.eventType.color}08 40%, #09090b 100%)`,
          }}
        >
          <div
            className="absolute top-10 right-10 w-80 h-80 rounded-full blur-[100px] opacity-20"
            style={{ backgroundColor: event.eventType.color }}
          />

          <div className="relative z-10 flex flex-col justify-end h-full p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <Badge
                className="text-xs font-medium border-0"
                style={{ backgroundColor: `${event.eventType.color}20`, color: event.eventType.color }}
              >
                {event.eventType.name}
              </Badge>
              {event.featured && (
                <Badge className="bg-orange-500/90 text-white text-xs border-0">Featured</Badge>
              )}
              <Badge className={`text-xs border-0 ${
                event.status === "OPEN" ? "bg-green-500/20 text-green-400" :
                event.status === "CLOSED" ? "bg-zinc-500/20 text-zinc-400" :
                "bg-blue-500/20 text-blue-400"
              }`}>
                {event.status}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{event.title}</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Organized by</span>
              <span className="text-white font-medium">{event.organizer.name}</span>
              {event.organizer.verified && <CheckCircle2 className="h-4 w-4 text-orange-500" />}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 space-y-6"
        >
          {/* Key Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <Calendar className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-xs text-zinc-500 mb-0.5">Date</p>
              <p className="text-sm font-medium text-white">{dateStr}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <Clock className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-xs text-zinc-500 mb-0.5">Time</p>
              <p className="text-sm font-medium text-white">{timeStr}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <MapPin className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-xs text-zinc-500 mb-0.5">Destination</p>
              <p className="text-sm font-medium text-white truncate">{event.destination.address}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <Users className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-xs text-zinc-500 mb-0.5">Spots</p>
              <p className="text-sm font-medium text-white">{event.registeredCount}/{event.capacity}</p>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
            <h2 className="text-base font-semibold text-white mb-3">About this event</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">{event.description}</p>
          </div>

          {/* Route */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
            <h2 className="text-base font-semibold text-white mb-4">Route</h2>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900" />
                <div className="w-0.5 h-12 bg-zinc-700" />
                <div className="w-3 h-3 rounded-full border-2 border-zinc-900" style={{ backgroundColor: event.eventType.color }} />
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Starting Point</p>
                  <p className="text-sm text-white">{event.startLocation.address}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Destination</p>
                  <p className="text-sm text-white">{event.destination.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety */}
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-green-500" />
              <h3 className="text-sm font-semibold text-green-400">Safety First</h3>
            </div>
            <p className="text-xs text-zinc-400">
              All participants are required to follow safety guidelines. Ensure your emergency contacts are updated in your profile before joining.
            </p>
          </div>

          {/* Participants */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">
                Participants ({event.registeredCount})
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {event.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-zinc-700 text-zinc-300 text-[10px]">
                      {p.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-zinc-300">{p.name}</span>
                </div>
              ))}
              {event.registeredCount > event.participants.length && (
                <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                  <span className="text-sm text-zinc-500">
                    +{event.registeredCount - event.participants.length} more
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Similar Events */}
          {similarEvents.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-white mb-4">Similar Events</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarEvents.map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Sticky Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:w-80 shrink-0"
        >
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Join Card */}
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <div className="text-center mb-4">
                <span className={`text-2xl font-bold ${event.price > 0 ? "text-white" : "text-green-400"}`}>
                  {priceDisplay}
                </span>
                {event.price > 0 && (
                  <span className="text-sm text-zinc-500 ml-1">per person</span>
                )}
              </div>

              {/* Capacity */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-zinc-400">{event.registeredCount} joined</span>
                  <span className={isFull ? "text-red-400 font-medium" : "text-zinc-500"}>
                    {isFull ? "Full" : `${spotsLeft} spots left`}
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${capacityPercent}%`,
                      backgroundColor: isFull ? "#ef4444" : event.eventType.color,
                    }}
                  />
                </div>
              </div>

              <Button
                variant="glow"
                className="w-full h-11 rounded-xl text-base"
                disabled={isFull}
              >
                {isFull ? "Event Full" : "Join Event"}
              </Button>

              <button className="flex items-center justify-center gap-2 w-full mt-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <Share2 className="h-4 w-4" />
                Share Event
              </button>
            </div>

            {/* Organizer Card */}
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-orange-500/10 text-orange-500 font-bold">
                    {event.organizer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-white">{event.organizer.name}</span>
                    {event.organizer.verified && <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{event.organizer.eventCount} events</span>
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      {event.organizer.rating}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mb-3">{event.organizer.bio}</p>
              <Link href={`/@${event.organizer.slug}`}>
                <Button variant="outline" className="w-full rounded-xl border-zinc-700 text-sm">
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
