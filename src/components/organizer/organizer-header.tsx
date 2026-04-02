"use client"

import { MapPin, BadgeCheck, Star } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FollowButton } from "./follow-button"
import { PinOrganizerButton } from "./pin-organizer-button"
import { ShareProfileButton } from "./share-profile-button"
import { SocialLinks } from "./social-links"

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
  isFollowing: boolean
  isPinned: boolean
  isAuthenticated: boolean
  isOwnProfile: boolean
}

export function OrganizerHeader({
  organizer,
  stats,
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

  return (
    <div>
      {/* Profile Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Avatar className="h-24 w-24 border-2 border-orange-500/30">
          {organizer.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organizer.image} alt={organizer.name || ""} className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className="bg-orange-500/10 text-orange-500 text-2xl font-bold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
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
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex items-center gap-2 shrink-0">
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
            <ShareProfileButton slug={organizer.slug} />
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
        <StatCard label="Events" value={stats.eventsCount.toString()} />
        <StatCard label="Followers" value={stats.followersCount.toString()} />
        <StatCard label="Participants" value={stats.totalParticipants.toString()} />
        <StatCard
          label="Rating"
          value={
            stats.avgRating
              ? `${stats.avgRating.toFixed(1)}`
              : "N/A"
          }
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
