import { redirect } from "next/navigation"
import {
  Rocket,
  Eye,
  UserCheck,
  Heart,
  Share2,
  TrendingUp,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { getFunnelStats } from "@/lib/analytics"

const NAME_LABELS: Record<string, string> = {
  event_published: "Event published",
  event_viewed: "Event viewed",
  event_registered: "Registered",
  organizer_viewed: "Organiser viewed",
  organizer_followed: "Followed",
  share_clicked: "Shared",
  link_copied: "Link copied",
}

function pct(v: number | null): string {
  return v == null ? "—" : `${(v * 100).toFixed(1)}%`
}

export default async function MetricsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const role = (session.user as { role?: string }).role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/")

  const stats = await getFunnelStats()
  const t = stats.totals
  const shares = t.share_clicked + t.link_copied

  // The wedge loop, top to bottom.
  const funnel = [
    { label: "Events Published", value: t.event_published, icon: Rocket, color: "text-orange-500", bg: "bg-orange-500/10", hint: "Activation" },
    { label: "Event Views", value: t.event_viewed, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10", hint: "Top of funnel" },
    { label: "Registrations", value: t.event_registered, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10", hint: "Conversion" },
    { label: "Follows", value: t.organizer_followed, icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10", hint: "Come-back hook" },
    { label: "Shares", value: shares, icon: Share2, color: "text-amber-500", bg: "bg-amber-500/10", hint: "Distribution" },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Loop Metrics</h1>
        <p className="text-zinc-400 mt-1">
          The wedge funnel: publish → view → register → follow → share.
        </p>
      </div>

      {/* Funnel cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {funnel.map((s) => (
          <Card key={s.label} className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-5">
              <div className={`mb-3 inline-flex p-2.5 rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-3xl font-bold text-white">{s.value.toLocaleString()}</div>
              <div className="text-sm text-zinc-400 mt-1">{s.label}</div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-600 mt-0.5">{s.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
              <div>
                <p className="text-sm text-white">View → Register</p>
                <p className="text-xs text-zinc-500">Are event pages converting?</p>
              </div>
              <span className="text-2xl font-bold text-green-400">
                {pct(stats.conversion.viewToRegister)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
              <div>
                <p className="text-sm text-white">Register → Follow</p>
                <p className="text-xs text-zinc-500">Is the come-back hook landing?</p>
              </div>
              <span className="text-2xl font-bold text-rose-400">
                {pct(stats.conversion.registerToFollow)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.recent.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-4 py-2.5"
                  >
                    <span className="text-sm text-zinc-300">{NAME_LABELS[e.name] || e.name}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(e.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
