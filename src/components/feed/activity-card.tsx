"use client"

import { motion } from "framer-motion"
import { UserPlus, Trophy, Sparkles, Award } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { MockActivity } from "@/lib/mock-data"

const activityIcons = {
  join: UserPlus,
  complete: Trophy,
  create: Sparkles,
  badge: Award,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ActivityCard({ activity, index = 0 }: { activity: MockActivity; index?: number }) {
  const Icon = activityIcons[activity.type]
  const color = activity.event?.typeColor || "#f97316"

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-start gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-3.5"
    >
      <div
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[8px]">
              {activity.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-zinc-300">
            <span className="font-medium text-white">{activity.user.name}</span>
            {" "}{activity.description}
          </span>
        </div>
        {activity.event && (
          <p className="text-xs font-medium mt-1" style={{ color }}>
            {activity.event.title}
          </p>
        )}
        <p className="text-[11px] text-zinc-600 mt-1">{timeAgo(activity.createdAt)}</p>
      </div>
    </motion.div>
  )
}
