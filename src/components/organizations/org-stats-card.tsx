"use client"

import { motion } from "framer-motion"
import { Calendar, Users, Star, UserCheck } from "lucide-react"

interface OrgStatsCardProps {
  events: number
  members: number
  rating: number | null
  participants: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export function OrgStatsCard({ events, members, rating, participants }: OrgStatsCardProps) {
  const stats = [
    { label: "Events", value: events, icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Members", value: members, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Rating", value: rating !== null ? rating.toFixed(1) : "N/A", icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Participants", value: participants, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={item}
          className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4 text-center"
        >
          <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div className="text-xl font-bold text-white">{stat.value}</div>
          <div className="text-xs text-zinc-500">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}
