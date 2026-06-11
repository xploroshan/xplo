"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"

// Bell with a live unread badge. Re-checks when the route changes (e.g. after
// visiting /notifications, which marks everything read).
export function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    let active = true
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setUnread(d.unreadCount || 0)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [pathname])

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  )
}
