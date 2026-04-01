"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Calendar,
  LayoutGrid,
  MessageCircle,
  User,
  Compass,
  Bell,
  Search,
  Pin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Feed", href: "/feed", icon: LayoutGrid },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Profile", href: "/profile", icon: User },
]

interface PinnedOrganizer {
  id: string
  organizer: {
    id: string
    name: string | null
    image: string | null
    slug: string | null
    verified: boolean
  }
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [pins, setPins] = useState<PinnedOrganizer[]>([])

  useEffect(() => {
    if (!session?.user) return
    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => {
        if (data.pins) setPins(data.pins)
      })
      .catch(() => {})
  }, [session?.user])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-800/50 bg-zinc-950 h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              HYK<span className="text-orange-500">RZ</span>
            </span>
          </Link>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-3 py-2.5">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search events..."
              className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-full"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}

          {/* Pinned Organizers */}
          {pins.length > 0 && (
            <div className="pt-4 mt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 px-4 mb-2">
                <Pin className="h-3 w-3 text-zinc-600" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Pinned
                </span>
              </div>
              {pins.map((pin) => {
                const slug = pin.organizer.slug
                const isActive = pathname === `/organizer/${slug}`
                const initials = pin.organizer.name
                  ? pin.organizer.name.charAt(0).toUpperCase()
                  : "?"
                return (
                  <Link
                    key={pin.id}
                    href={`/@${slug}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-orange-500/10 text-orange-500"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    )}
                  >
                    <Avatar className="h-6 w-6">
                      {pin.organizer.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pin.organizer.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-orange-500/10 text-orange-500 text-[10px] font-bold">
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="truncate">{pin.organizer.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* Notifications */}
        <div className="p-4 border-t border-zinc-800/50">
          <Link
            href="/notifications"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
          >
            <Bell className="h-5 w-5" />
            Notifications
          </Link>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all",
                  isActive ? "text-orange-500" : "text-zinc-500"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
