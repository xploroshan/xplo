"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Users,
  Calendar,
  Building2,
  Star,
  TrendingUp,
  Activity,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PlatformStats {
  totalUsers: number
  activeEvents: number
  organizations: number
  totalRatings: number
  usersChange?: string
  eventsChange?: string
  orgsChange?: string
  ratingsChange?: string
}

interface ActivityItem {
  id: string
  type: string
  message: string
  createdAt: string
}

export function AdminStatsDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats")
        if (!res.ok) throw new Error("Failed to load")
        const data = await res.json()
        setStats(data.stats ?? {
          totalUsers: 0,
          activeEvents: 0,
          organizations: 0,
          totalRatings: 0,
        })
        setRecentActivity(data.recentActivity ?? [])
      } catch {
        setStats({
          totalUsers: 0,
          activeEvents: 0,
          organizations: 0,
          totalRatings: 0,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: stats.usersChange ?? "+0%",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Events",
      value: stats.activeEvents.toLocaleString(),
      change: stats.eventsChange ?? "+0%",
      icon: Calendar,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Organizations",
      value: stats.organizations.toLocaleString(),
      change: stats.orgsChange ?? "+0%",
      icon: Building2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Total Ratings",
      value: stats.totalRatings.toLocaleString(),
      change: stats.ratingsChange ?? "+0%",
      icon: Star,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <span className="flex items-center gap-1 text-xs text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </span>
                </div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts placeholder + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Charts Placeholder */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-800/30">
              <div className="text-center">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                <p className="text-sm text-zinc-500">Charts coming soon</p>
                <p className="text-xs text-zinc-600">
                  User growth, event trends, rating distribution
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-orange-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"
                  >
                    <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-300">{item.message}</p>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-zinc-500">
                  No recent activity. Platform activity will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
