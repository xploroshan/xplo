"use client"

import { MapPin, BadgeCheck, Star } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FollowButton } from "./follow-button"
import { PinOrganizerButton } from "./pin-organizer-button"
import { ShareProfileButton } from "./share-profile-button"
import { SocialLinks } from "./social-links"
import { OrganizerBadges } from "./organizer-badges"

interface OrganizerHeaderProps {
  organizer: {
    id: string
    name: string | null
    image: string | null
    bio: string | null
    city: string | null
    slug: string
    verified: boolean
    socialLinks: Record<string, string> | null
  }
  stats: {
    eventsCount: number
    followersCount: number
    totalParticipants: number
    avgRating: number | null
    ratingCount: number
  }
  /** Year the organiser joined, for the "Since YYYY" achievement. */
  memberSince: number | null
  isFollowing: boolean
  isPinned: boolean
  isAuthenticated: boolean
  isOwnProfile: boolean
}

export function OrganizerHeader({
  organizer,
  stats,
  memberSince,
  isFollowing,
  isPinned,
  isAuthenticated,
  isOwnProfile,
}: OrganizerHeaderProps) {
  const initials = organizer.name
    ? organizer.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  // Deterministic, per-organiser hero gradient blended into the dark theme.
  const seed = Array.from(organizer.name || "HYKRZ").reduce(
    (a, c) => a + c.charCodeAt(0),
    0
  )
  const hue = seed % 360
  const coverGradient = `linear-gradient(135deg, hsl(${hue} 55% 16%) 0%, hsl(${(hue + 40) % 360} 45% 10%) 45%, #09090b 100%)`

  return (
    <div>
      {/* Cover / hero band */}
      <div
        className="relative h-32 sm:h-44 rounded-2xl overflow-hidden border border-zinc-800/50"
        style={{ background: coverGradient }}
      >
        <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
      </div>

      {/* Avatar + actions */}
      <div className="px-1 sm:px-2 -mt-12 sm:-mt-14">
        <div className="flex items-end justify-between gap-4">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background ring-2 ring-orange-500/30">
            {organizer.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organizer.image}
                alt={organizer.name || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-orange-500/10 text-orange-500 text-2xl font-bold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          {!isOwnProfile && (
            <div className="flex items-center gap-2 pb-1 shrink-0">
              <FollowButton
                organizerId={organizer.id}
                initialFollowing={isFollowing}
                isAuthenticated={isAuthenticated}
              />
              <PinOrganizerButton
                organizerId={organizer.id}
                initialPinned={isPinned}
                isAuthenticated={isAuthenticated}
              />
              <ShareProfileButton slug={organizer.slug} name={organizer.name} />
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{organizer.name}</h1>
            {organizer.verified && (
              <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" />
            )}
          </div>

          {organizer.city && (
            <p className="text-zinc-400 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4 shrink-0" /> {organizer.city}
            </p>
          )}

          {organizer.bio && (
            <p className="text-zinc-500 text-sm mt-2 max-w-lg">{organizer.bio}</p>
          )}

          {organizer.socialLinks && (
            <div className="mt-3">
              <SocialLinks links={organizer.socialLinks} />
            </div>
          )}

          {/* Trust / achievements */}
          <div className="mt-4">
            <OrganizerBadges
              verified={organizer.verified}
              stats={stats}
              memberSince={memberSince}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <StatCard label="Events" value={stats.eventsCount.toString()} />
        <StatCard label="Followers" value={stats.followersCount.toString()} />
        <StatCard label="Riders Led" value={stats.totalParticipants.toString()} />
        <StatCard
          label="Rating"
          value={stats.avgRating ? `${stats.avgRating.toFixed(1)}` : "N/A"}
          icon={stats.avgRating ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : undefined}
          subtitle={stats.ratingCount > 0 ? `${stats.ratingCount} reviews` : undefined}
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  subtitle?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
      {subtitle && <p className="text-[10px] text-zinc-600 mt-0.5">{subtitle}</p>}
    </div>
  )
}
