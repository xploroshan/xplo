"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, Users, MessageSquare, Loader2 } from "lucide-react"
import { OrgProfileHeader } from "@/components/organizations/org-profile-header"
import { OrgEventCard } from "@/components/organizations/org-event-card"
import { OrgTeamGrid } from "@/components/organizations/org-team-grid"
import { OrgStatsCard } from "@/components/organizations/org-stats-card"
import { useSession } from "next-auth/react"

type Tab = "events" | "team" | "reviews"

interface OrgData {
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
  members: Array<{
    id: string
    name: string
    image?: string | null
    slug: string
    role: "OWNER" | "ADMIN" | "EVENT_MANAGER" | "MEMBER"
    title?: string | null
    avgRating?: number | null
    eventCount?: number
  }>
}

interface EventData {
  id: string
  slug: string
  title: string
  coverImage?: string | null
  startDate: string
  destination: string
  status: string
  organizer: { name: string; image?: string | null }
  eventType: { name: string; icon?: string; color: string }
  participantCount: number
  avgRating: number | null
}

interface ReviewData {
  id: string
  rating: number
  comment: string
  createdAt: string
  user: { name: string; image?: string | null }
  event: { title: string; slug: string }
}

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "events", label: "Events", icon: Calendar },
  { key: "team", label: "Team", icon: Users },
  { key: "reviews", label: "Reviews", icon: MessageSquare },
]

export default function OrgProfilePage() {
  const params = useParams()
  const slug = params.slug as string
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>("events")
  const [org, setOrg] = useState<OrgData | null>(null)
  const [events, setEvents] = useState<EventData[]>([])
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await fetch(`/api/organizations/${slug}`)
        if (!res.ok) throw new Error("Organization not found")
        const data = await res.json()
        setOrg(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    fetchOrg()
  }, [slug])

  useEffect(() => {
    if (!org) return

    if (activeTab === "events") {
      fetch(`/api/organizations/${slug}/events`)
        .then((r) => r.json())
        .then((data) => setEvents(Array.isArray(data) ? data : data.events ?? []))
        .catch(() => setEvents([]))
    } else if (activeTab === "reviews") {
      fetch(`/api/organizations/${slug}/reviews`)
        .then((r) => r.json())
        .then((data) => setReviews(Array.isArray(data) ? data : data.reviews ?? []))
        .catch(() => setReviews([]))
    }
  }, [org, activeTab, slug])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-lg text-zinc-400">{error ?? "Organization not found"}</p>
      </div>
    )
  }

  const isOwn =
    session?.user &&
    org.members?.some(
      (m) =>
        m.id === (session.user as { id?: string }).id &&
        ["OWNER", "ADMIN"].includes(m.role)
    )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <OrgProfileHeader org={org} isOwn={!!isOwn} />

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Main content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-zinc-800 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {events.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {events.map((event, i) => (
                    <OrgEventCard
                      key={event.id}
                      event={event}
                      orgLogo={org.logo}
                      orgName={org.name}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
                  <Calendar className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
                  <p className="text-zinc-500">No events yet</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "team" && (
            <motion.div
              key="team"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {org.members && org.members.length > 0 ? (
                <OrgTeamGrid members={org.members} />
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
                  <p className="text-zinc-500">No team members to display</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                        {review.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {review.user.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          on{" "}
                          <a
                            href={`/events/${review.event.slug}`}
                            className="text-orange-400 hover:underline"
                          >
                            {review.event.title}
                          </a>
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-sm text-orange-400">
                        {"★".repeat(Math.round(review.rating))}
                        <span className="text-xs text-zinc-500">
                          {"★".repeat(5 - Math.round(review.rating))}
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-zinc-300">{review.comment}</p>
                    )}
                    <p className="mt-2 text-xs text-zinc-600">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
                  <MessageSquare className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
                  <p className="text-zinc-500">No reviews yet</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6">
            <OrgStatsCard
              events={org.eventCount}
              members={org.memberCount}
              rating={org.avgRating}
              participants={org.participantCount}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
