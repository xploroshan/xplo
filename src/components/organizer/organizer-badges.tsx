import {
  BadgeCheck,
  Crown,
  Trophy,
  Flame,
  Flag,
  Star,
  Heart,
  Users,
  CalendarDays,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Lightweight, computed trust/achievement badges — the T2W "tiers" concept
// adapted to HYKRZ's existing organiser stats, so it ships with no schema
// change. Only earned badges render, highest tier first.
interface OrganizerBadgesProps {
  verified: boolean
  stats: {
    eventsCount: number
    followersCount: number
    totalParticipants: number
    avgRating: number | null
    ratingCount: number
  }
  memberSince: number | null
}

type Achievement = {
  key: string
  label: string
  icon: LucideIcon
  className: string
}

function computeAchievements({
  verified,
  stats,
  memberSince,
}: OrganizerBadgesProps): Achievement[] {
  const out: Achievement[] = []

  if (verified) {
    out.push({
      key: "verified",
      label: "Verified",
      icon: BadgeCheck,
      className: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    })
  }

  // Top rated — needs enough reviews to be meaningful.
  if (stats.avgRating != null && stats.avgRating >= 4.5 && stats.ratingCount >= 5) {
    out.push({
      key: "top-rated",
      label: "Top Rated",
      icon: Star,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    })
  }

  // Rides-led tier — pick the single highest the organiser has earned.
  const rideTier =
    stats.eventsCount >= 50
      ? { key: "legend", label: "Trail Legend", icon: Crown }
      : stats.eventsCount >= 25
        ? { key: "veteran", label: "Veteran Leader", icon: Trophy }
        : stats.eventsCount >= 10
          ? { key: "trailblazer", label: "Trailblazer", icon: Flame }
          : stats.eventsCount >= 1
            ? { key: "ride-leader", label: "Ride Leader", icon: Flag }
            : null
  if (rideTier) {
    out.push({
      ...rideTier,
      className: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    })
  }

  if (stats.totalParticipants >= 100) {
    out.push({
      key: "community-builder",
      label: `${stats.totalParticipants >= 500 ? "500+" : "100+"} Riders Led`,
      icon: Users,
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    })
  }

  if (stats.followersCount >= 100) {
    out.push({
      key: "favourite",
      label: "Community Favourite",
      icon: Heart,
      className: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    })
  }

  if (memberSince) {
    out.push({
      key: "since",
      label: `Since ${memberSince}`,
      icon: CalendarDays,
      className: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
    })
  }

  return out
}

export function OrganizerBadges(props: OrganizerBadgesProps) {
  const achievements = computeAchievements(props)
  if (achievements.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {achievements.map(({ key, label, icon: Icon, className }) => (
        <span
          key={key}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
            className
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
      ))}
    </div>
  )
}
