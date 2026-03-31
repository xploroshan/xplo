import {
  Users,
  Calendar,
  MessageCircle,
  TrendingUp,
  Activity,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stats = [
  { label: "Total Users", value: "0", change: "+0%", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Active Events", value: "0", change: "+0%", icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Messages Today", value: "0", change: "+0%", icon: MessageCircle, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Page Views", value: "0", change: "+0%", icon: Eye, color: "text-purple-500", bg: "bg-purple-500/10" },
]

export default function AdminDashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Welcome back, Super Admin. Here&apos;s your platform overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
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
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-zinc-500">No activity yet. Platform activity will appear here.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Manage Event Types", description: "Add, edit, or reorder event categories", href: "/admin/event-types" },
              { label: "User Management", description: "View, ban, or promote users", href: "/admin/users" },
              { label: "Platform Settings", description: "Configure app name, logos, and features", href: "/admin/settings" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 hover:bg-zinc-800/60 transition-colors group"
              >
                <div>
                  <div className="text-sm font-medium text-white">{action.label}</div>
                  <div className="text-xs text-zinc-500">{action.description}</div>
                </div>
                <TrendingUp className="h-4 w-4 text-zinc-600 group-hover:text-orange-500 transition-colors rotate-45" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
