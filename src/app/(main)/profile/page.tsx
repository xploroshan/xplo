"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import {
  Settings,
  MapPin,
  Calendar,
  Users,
  Route,
  Trophy,
  UserPlus,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BadgeIcon } from "@/components/ui/badge-icon"
import { EventCard } from "@/components/events/event-card"
import { OrganizerCta } from "@/components/profile/organizer-cta"
import { ChangePassword } from "@/components/profile/change-password"
import { MOCK_EVENTS, MOCK_BADGES, MOCK_ACTIVITIES } from "@/lib/mock-data"

const tabs = ["Activity", "Events", "Badges", "Settings"] as const
type Tab = (typeof tabs)[number]

const activityIcons = {
  join: UserPlus,
  complete: Trophy,
  create: Sparkles,
  badge: Trophy,
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>("Activity")

  const name = session?.user?.name || "HYKRZ User"
  const email = session?.user?.email || ""
  const initials = name.charAt(0).toUpperCase()

  const earnedBadges = MOCK_BADGES.filter((b) => b.earned).length
  const upcomingEvents = MOCK_EVENTS.filter((e) => new Date(e.startDate) > new Date()).slice(0, 3)
  const pastEvents = MOCK_EVENTS.filter((e) => new Date(e.startDate) <= new Date()).slice(0, 2)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Cover + Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-zinc-800/50 mb-6"
      >
        {/* Cover Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent relative">
          <div className="absolute top-4 right-4 w-48 h-48 rounded-full blur-[80px] bg-orange-500/15" />
        </div>

        {/* Profile Info */}
        <div className="relative px-5 pb-5">
          <Avatar className="h-20 w-20 -mt-10 border-4 border-zinc-950 shadow-xl">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between mt-3 gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">{name}</h1>
              <p className="text-sm text-zinc-400">{email}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Bangalore, India
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since 2026
                </span>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl border-zinc-700 text-sm gap-2 w-fit">
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: "Events", value: "8", icon: Calendar },
              { label: "Following", value: "12", icon: Users },
              { label: "Badges", value: String(earnedBadges), icon: Trophy },
              { label: "Distance", value: "340km", icon: Route },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center py-3 rounded-xl bg-zinc-800/30 border border-zinc-800/50"
              >
                <stat.icon className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800/50 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? "text-orange-500 border-orange-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "Activity" && (
          <div className="space-y-3">
            {MOCK_ACTIVITIES.map((activity) => {
              const Icon = activityIcons[activity.type]
              const color = activity.event?.typeColor || "#f97316"
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
                >
                  <div
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">
                      <span className="font-medium text-white">{activity.user.name}</span>
                      {" "}{activity.description}
                    </p>
                    {activity.event && (
                      <p className="text-xs font-medium mt-0.5" style={{ color }}>
                        {activity.event.title}
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-600 mt-1">
                      {new Date(activity.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === "Events" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Upcoming ({upcomingEvents.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            </div>
            {pastEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Past Events ({pastEvents.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastEvents.map((e, i) => (
                    <EventCard key={e.id} event={e} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Badges" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MOCK_BADGES.map((badge) => (
              <BadgeIcon key={badge.id} badge={badge} />
            ))}
          </div>
        )}

        {activeTab === "Settings" && (
          <div className="space-y-6">
            <OrganizerCta />
            <ChangePassword />
          </div>
        )}
      </motion.div>
    </div>
  )
}
