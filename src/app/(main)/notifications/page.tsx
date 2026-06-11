import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Calendar, UserPlus, Heart, MessageCircle, Bell } from "lucide-react"
import type { NotificationType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { APP_NAME } from "@/lib/constants"

export const metadata: Metadata = { title: `Notifications — ${APP_NAME}` }

const ICONS: Partial<Record<NotificationType, typeof Bell>> = {
  EVENT_INVITE: Calendar,
  EVENT_UPDATE: Calendar,
  EVENT_REMINDER: Calendar,
  RSVP_CONFIRMATION: Calendar,
  FOLLOW: UserPlus,
  LIKE: Heart,
  COMMENT: MessageCircle,
  MENTION: MessageCircle,
  MESSAGE: MessageCircle,
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/notifications")

  // Fetch first (so we can style still-unread rows), then mark everything read.
  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, type: true, title: true, content: true, link: true, read: true, createdAt: true },
  })
  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/60">
            <Bell className="h-6 w-6 text-zinc-500" />
          </div>
          <p className="text-zinc-400">No notifications yet.</p>
          <p className="text-sm text-zinc-600 mt-1">
            Follow organisers to hear when they publish a new ride.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Bell
            const row = (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                  n.read
                    ? "border-zinc-800/60 bg-zinc-900/40"
                    : "border-orange-500/20 bg-orange-500/5"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    n.read ? "bg-zinc-800 text-zinc-400" : "bg-orange-500/15 text-orange-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-sm text-zinc-400">{n.content}</p>
                  <p className="text-xs text-zinc-600 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />}
              </div>
            )
            return n.link ? (
              <Link key={n.id} href={n.link} className="block">
                {row}
              </Link>
            ) : (
              <div key={n.id}>{row}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
