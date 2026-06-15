"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationBell } from "./notification-bell"
import { CommandPalette } from "./command-palette"

const pageTitles: Record<string, string> = {
  "/events": "Discover",
  "/events/create": "Create Event",
  "/feed": "Feed",
  "/messages": "Messages",
  "/profile": "Profile",
  "/notifications": "Notifications",
}

export function AppTopBar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname === path || (path !== "/" && pathname.startsWith(path + "/"))
  )?.[1] || "HYKRZ"

  const initials = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : "?"

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <h1 className="text-lg font-semibold text-white">{title}</h1>

        <CommandPalette />

        <div className="flex items-center gap-3">
          <NotificationBell />

          <Link href="/profile" className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-zinc-700">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-orange-500/10 text-orange-500 text-xs font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
