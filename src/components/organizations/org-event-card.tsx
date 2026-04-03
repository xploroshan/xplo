"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Calendar, MapPin, Star, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface OrgEventCardProps {
  event: {
    id: string
    slug: string
    title: string
    coverImage?: string | null
    startDate: string
    destination: string
    status: string
    organizer: {
      name: string
      image?: string | null
    }
    eventType: {
      name: string
      icon?: string
      color: string
    }
    participantCount: number
    avgRating: number | null
  }
  orgLogo?: string | null
  orgName?: string
  index?: number
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: "Open", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  COMPLETED: { label: "Completed", color: "text-zinc-400", bg: "bg-zinc-700/50 border-zinc-600/20" },
  CANCELLED: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  DRAFT: { label: "Draft", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  FULL: { label: "Full", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function OrgEventCard({ event, orgLogo, orgName, index = 0 }: OrgEventCardProps) {
  const status = statusConfig[event.status] ?? statusConfig.OPEN

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/events/${event.slug}`} className="block group">
        <div className="overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 transition-all duration-300 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20 group-hover:-translate-y-1">
          {/* Cover Image */}
          <div className="relative aspect-[16/10] overflow-hidden bg-zinc-800">
            {event.coverImage ? (
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${event.eventType.color}20 0%, transparent 100%)`,
                }}
              />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Org Badge - Top Left */}
            {orgName && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/80 px-2.5 py-1 backdrop-blur-sm">
                {orgLogo ? (
                  <Image
                    src={orgLogo}
                    alt={orgName}
                    width={16}
                    height={16}
                    className="rounded-sm"
                  />
                ) : (
                  <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-zinc-700 text-[8px] font-bold text-zinc-300">
                    {orgName.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-medium text-zinc-200">{orgName}</span>
              </div>
            )}

            {/* Status Badge - Top Right */}
            <div className="absolute right-3 top-3">
              <Badge className={`border text-[10px] ${status.bg} ${status.color}`}>
                {status.label}
              </Badge>
            </div>

            {/* Event Type Badge */}
            <div className="absolute bottom-3 left-3">
              <Badge
                className="border-0 text-xs font-medium backdrop-blur-sm"
                style={{
                  backgroundColor: `${event.eventType.color}20`,
                  color: event.eventType.color,
                }}
              >
                {event.eventType.name}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="mb-2 truncate text-base font-semibold text-white group-hover:text-orange-400 transition-colors">
              {event.title}
            </h3>

            <div className="mb-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(event.startDate)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <MapPin className="h-3.5 w-3.5" />
                {event.destination}
              </div>
            </div>

            {/* Organizer */}
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-5 overflow-hidden rounded-full bg-zinc-700">
                {event.organizer.image ? (
                  <Image
                    src={event.organizer.image}
                    alt={event.organizer.name}
                    width={20}
                    height={20}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[8px] font-medium text-zinc-400">
                    {event.organizer.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-xs text-zinc-500">
                by {event.organizer.name}
              </span>
            </div>

            {/* Footer: Rating & Participants */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                {event.avgRating !== null ? (
                  <>
                    <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                    <span className="font-medium text-white">{event.avgRating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-zinc-500">No ratings</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Users className="h-3.5 w-3.5" />
                {event.participantCount} joined
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
