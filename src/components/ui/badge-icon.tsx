"use client"

import {
  Flag, Compass, Heart, Zap, Clock, CloudRain, Award, Flame,
} from "lucide-react"
import type { MockBadge } from "@/lib/mock-data"

const iconMap: Record<string, React.ElementType> = {
  Flag, Compass, Heart, Zap, Clock, CloudRain, Award, Flame,
}

const rarityColors = {
  bronze: { bg: "bg-amber-900/20", border: "border-amber-700/30", text: "text-amber-600", glow: "" },
  silver: { bg: "bg-zinc-400/10", border: "border-zinc-500/30", text: "text-zinc-300", glow: "" },
  gold: { bg: "bg-yellow-500/15", border: "border-yellow-500/30", text: "text-yellow-500", glow: "shadow-yellow-500/10" },
  platinum: { bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-400", glow: "shadow-purple-500/10" },
}

export function BadgeIcon({ badge }: { badge: MockBadge }) {
  const Icon = iconMap[badge.icon] || Award
  const colors = rarityColors[badge.rarity]

  return (
    <div
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
        badge.earned
          ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}`
          : "bg-zinc-900/30 border-zinc-800/50 opacity-40"
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        badge.earned ? colors.bg : "bg-zinc-800/50"
      }`}>
        <Icon className={`h-5 w-5 ${badge.earned ? colors.text : "text-zinc-600"}`} />
      </div>
      <div className="text-center">
        <p className={`text-xs font-semibold ${badge.earned ? "text-white" : "text-zinc-600"}`}>
          {badge.name}
        </p>
        <p className="text-[10px] text-zinc-500 mt-0.5">{badge.description}</p>
      </div>
      {badge.earned && (
        <span className={`text-[9px] font-medium uppercase tracking-wider ${colors.text}`}>
          {badge.rarity}
        </span>
      )}
    </div>
  )
}
