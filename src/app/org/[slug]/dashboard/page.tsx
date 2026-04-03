"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Calendar,
  Users,
  Star,
  TrendingUp,
  Plus,
  UserPlus,
  Settings,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  eventsThisMonth: number
  newMembers: number
  avgRating: number | null
  totalEvents: number
  totalMembers: number
  totalParticipants: number
}

interface RecentEvent {
  id: string
  title: string
  slug: string
  status: string
  startDate: string
  participantCount: number
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: "Open", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  COMPLETED: { label: "Completed", color: "text-zinc-400", bg: "bg-zinc-700/50 border-zinc-600/20" },
  CANCELLED: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  DRAFT: { label: "Draft", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  FULL: { label: "Full", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
}

export default function OrgDashboardPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/org/${slug}`)
      return
    }
    if (authStatus !== "authenticated") return

    async function fetchDashboard() {
      try {
        const res = await fetch(`/api/organizations/${slug}/dashboard`)
        if (res.status === 403 || res.status === 401) {
          router.push(`/org/${slug}`)
          return
        }
        if (!res.ok) throw new Error("Failed to load dashboard")
        const data = await res.json()
        setStats(data.stats ?? {
          eventsThisMonth: 0,
          newMembers: 0,
          avgRating: null,
          totalEvents: 0,
          totalMembers: 0,
          totalParticipants: 0,
        })
        setRecentEvents(data.recentEvents ?? [])
        setAuthorized(true)
      } catch {
        router.push(`/org/${slug}`)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [slug, authStatus, router, session])

  if (loading || authStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!authorized || !stats) return null

  const statCards = [
    {
      label: "Events This Month",
      value: stats.eventsThisMonth,
      icon: Calendar,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "New Members",
      value: stats.newMembers,
      icon: UserPlus,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Avg Rating",
      value: stats.avgRating !== null ? stats.avgRating.toFixed(1) : "N/A",
      icon: Star,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Total Participants",
      value: stats.totalParticipants,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organization Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your organization and track performance
          </p>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-xs text-zinc-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 border-zinc-800 bg-zinc-900/50 px-6 py-5 hover:border-orange-500/30 hover:bg-orange-500/5"
          onClick={() => router.push("/events/create")}
        >
          <Plus className="h-5 w-5 text-orange-500" />
          <span className="text-sm text-white">Create Event</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 border-zinc-800 bg-zinc-900/50 px-6 py-5 hover:border-blue-500/30 hover:bg-blue-500/5"
          onClick={() => router.push(`/org/${slug}/members`)}
        >
          <Users className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-white">Manage Members</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 border-zinc-800 bg-zinc-900/50 px-6 py-5 hover:border-green-500/30 hover:bg-green-500/5"
          onClick={() => router.push(`/org/${slug}/settings`)}
        >
          <Settings className="h-5 w-5 text-green-500" />
          <span className="text-sm text-white">Edit Profile</span>
        </Button>
      </motion.div>

      {/* Recent Events */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-orange-500" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length > 0 ? (
              <div className="space-y-2">
                {recentEvents.map((event) => {
                  const s = statusConfig[event.status] ?? statusConfig.OPEN
                  return (
                    <a
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 transition-colors hover:bg-zinc-800/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white group-hover:text-orange-400 transition-colors">
                          {event.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {new Date(event.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {" · "}
                          {event.participantCount} participants
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`border text-[10px] ${s.bg} ${s.color}`}>
                          {s.label}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-zinc-500">No events yet. Create your first event!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
