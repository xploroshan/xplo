import Link from "next/link"
import {
  Users,
  Calendar,
  Building2,
  Star,
  TrendingUp,
  Activity,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

async function getStats() {
  const [
    totalUsers,
    organizers,
    activeEvents,
    totalOrgs,
    pendingOrgs,
    totalRatings,
    recentEvents,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: { in: ["ORGANIZER", "ADMIN", "SUPER_ADMIN"] } } }),
    db.event.count({ where: { status: { in: ["PUBLISHED", "OPEN", "ACTIVE"] } } }),
    db.organization.count({ where: { status: "ACTIVE" } }),
    db.organization.count({ where: { status: "PENDING" } }),
    db.eventParticipant.count({ where: { rating: { not: null } } }),
    db.event.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        organizer: { select: { name: true } },
      },
    }),
  ])

  return {
    totalUsers,
    organizers,
    activeEvents,
    totalOrgs,
    pendingOrgs,
    totalRatings,
    recentEvents,
  }
}

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const role = (session.user as { role?: string }).role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    redirect("/")
  }

  const stats = await getStats()

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Events", value: stats.activeEvents.toLocaleString(), icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Organizations", value: stats.totalOrgs.toLocaleString(), icon: Building2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Total Ratings", value: stats.totalRatings.toLocaleString(), icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Welcome back, Super Admin. Here&apos;s your platform overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.label === "Organizations" && stats.pendingOrgs > 0 && (
                  <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {stats.pendingOrgs} pending
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">No events yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{event.title}</p>
                      <p className="text-xs text-zinc-500">by {event.organizer.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      event.status === "OPEN" ? "bg-green-500/20 text-green-400" :
                      event.status === "COMPLETED" ? "bg-zinc-500/20 text-zinc-400" :
                      event.status === "DRAFT" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Manage Organizations", description: `${stats.pendingOrgs} pending approval`, href: "/admin/organizations", icon: Building2 },
              { label: "Rating Overrides", description: "Override org/user ratings", href: "/admin/ratings", icon: Star },
              { label: "Manage Event Types", description: "Add, edit, or reorder categories", href: "/admin/event-types", icon: Calendar },
              { label: "User Management", description: `${stats.totalUsers} users, ${stats.organizers} organizers`, href: "/admin/users", icon: Users },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 hover:bg-zinc-800/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800">
                    <action.icon className="h-4 w-4 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{action.label}</div>
                    <div className="text-xs text-zinc-500">{action.description}</div>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-zinc-600 group-hover:text-orange-500 transition-colors rotate-45" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
