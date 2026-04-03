"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { BadgeCheck, MapPin, Star, Share2, UserPlus, ChevronDown, ChevronUp, Users, Calendar, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrgProfileHeaderProps {
  org: {
    id: string
    name: string
    slug: string
    logo?: string | null
    banner?: string | null
    description?: string | null
    city?: string | null
    verified: boolean
    avgRating: number | null
    ratingCount: number
    eventCount: number
    memberCount: number
    participantCount: number
  }
  isOwn?: boolean
}

export function OrgProfileHeader({ org, isOwn = false }: OrgProfileHeaderProps) {
  const [expanded, setExpanded] = useState(false)
  const [following, setFollowing] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-t-2xl bg-zinc-800">
        {org.banner ? (
          <Image
            src={org.banner}
            alt={`${org.name} banner`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-zinc-800" />
        )}
      </div>

      {/* Content */}
      <div className="relative rounded-b-2xl border border-t-0 border-zinc-700 bg-zinc-900 px-6 pb-6">
        {/* Logo */}
        <div className="-mt-10 mb-4 flex items-end justify-between">
          <div className="h-20 w-20 overflow-hidden rounded-xl border-4 border-zinc-900 bg-zinc-800 shadow-lg">
            {org.logo ? (
              <Image
                src={org.logo}
                alt={org.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-400">
                {org.name.charAt(0)}
              </div>
            )}
          </div>

          {!isOwn && (
            <div className="flex gap-2">
              <Button
                variant={following ? "outline" : "glow"}
                size="sm"
                onClick={() => setFollowing(!following)}
              >
                <UserPlus className="h-4 w-4" />
                {following ? "Following" : "Follow Org"}
              </Button>
              <Button variant="outline" size="icon" className="border-zinc-700">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Name & Badge */}
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">{org.name}</h1>
          {org.verified && (
            <BadgeCheck className="h-6 w-6 text-blue-500" />
          )}
        </div>

        {/* City */}
        {org.city && (
          <div className="mb-3 flex items-center gap-1.5 text-sm text-zinc-400">
            <MapPin className="h-4 w-4" />
            {org.city}
          </div>
        )}

        {/* Description */}
        {org.description && (
          <div className="mb-4">
            <p
              className={`text-sm text-zinc-300 ${
                !expanded ? "line-clamp-2" : ""
              }`}
            >
              {org.description}
            </p>
            {org.description.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-1 text-xs text-orange-500 hover:text-orange-400 transition-colors"
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 sm:grid-cols-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Events</span>
            </div>
            <div className="text-lg font-bold text-white">{org.eventCount}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Team</span>
            </div>
            <div className="text-lg font-bold text-white">{org.memberCount}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 mb-1">
              <UserCheck className="h-4 w-4" />
              <span className="text-xs">Participants</span>
            </div>
            <div className="text-lg font-bold text-white">{org.participantCount}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 mb-1">
              <Star className="h-4 w-4" />
              <span className="text-xs">Rating</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-white">
              {org.avgRating !== null ? (
                <>
                  <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                  {org.avgRating.toFixed(1)}
                  <span className="text-xs font-normal text-zinc-500">
                    ({org.ratingCount})
                  </span>
                </>
              ) : (
                <span className="text-sm text-zinc-500">No ratings</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
