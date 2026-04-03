"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Star, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TeamMember {
  id: string
  name: string
  image?: string | null
  slug: string
  role: "OWNER" | "ADMIN" | "EVENT_MANAGER" | "MEMBER"
  title?: string | null
  avgRating?: number | null
  eventCount?: number
}

interface OrgTeamGridProps {
  members: TeamMember[]
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  OWNER: { label: "Owner", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  ADMIN: { label: "Admin", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  EVENT_MANAGER: { label: "Event Manager", color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
  MEMBER: { label: "Member", color: "text-zinc-400", bg: "bg-zinc-700/50 border-zinc-600/20" },
}

export function OrgTeamGrid({ members }: OrgTeamGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {members.map((member, index) => {
        const role = roleConfig[member.role] ?? roleConfig.MEMBER
        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link href={`/@${member.slug}`} className="block group">
              <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4 transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/50 group-hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-zinc-800">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-zinc-400">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-white">
                      {member.name}
                    </h3>
                    {member.title && (
                      <p className="truncate text-xs text-zinc-500">{member.title}</p>
                    )}
                    <Badge
                      className={`mt-1.5 border text-[10px] ${role.bg} ${role.color}`}
                    >
                      {role.label}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-3 flex items-center gap-3 border-t border-zinc-800 pt-3">
                  {member.avgRating != null && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                      {member.avgRating.toFixed(1)}
                    </div>
                  )}
                  {member.eventCount != null && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <Calendar className="h-3 w-3" />
                      {member.eventCount} events
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
