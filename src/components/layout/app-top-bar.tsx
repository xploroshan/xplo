"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Bell, Search } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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

        <div className="hidden md:flex items-center gap-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-500 cursor-pointer hover:border-zinc-600 transition-colors">
          <Search className="h-3.5 w-3.5" />
          <span>Search events...</span>
          <kbd className="ml-4 px-1.5 py-0.5 rounded bg-zinc-700/50 text-[10px] font-mono text-zinc-400">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
          </Link>

          <Link href="/profile" className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-zinc-700">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="h-full w-full object-cover" />
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
