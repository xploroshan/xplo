"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Compass,
  LayoutGrid,
  MessageCircle,
  User,
  Bell,
  Pin,
  Plus,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { label: "Discover", href: "/events", icon: Compass },
  { label: "Feed", href: "/feed", icon: LayoutGrid },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Profile", href: "/profile", icon: User },
]

const mobileNavItems = [
  { label: "Discover", href: "/events", icon: Compass },
  { label: "Feed", href: "/feed", icon: LayoutGrid },
  { label: "Create", href: "/events/create", icon: Plus, isCreate: true },
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

  const initials = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : "?"

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-800/50 bg-zinc-950 h-screen sticky top-0">
        {/* Logo */}
        <div className="p-5 pb-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              HYK<span className="text-orange-500">RZ</span>
            </span>
          </Link>
        </div>

        {/* Create Event Button */}
        <div className="px-3 mb-2">
          <Link href="/events/create">
            <Button variant="glow" className="w-full rounded-xl h-10 gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.label === "Messages" && (
                  <Badge className="ml-auto bg-orange-500/20 text-orange-400 text-[10px] px-1.5 py-0 border-0">
                    3
                  </Badge>
                )}
              </Link>
            )
          })}

          {/* Pinned Organizers */}
          {pins.length > 0 && (
            <div className="pt-4 mt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 px-3 mb-2">
                <Pin className="h-3 w-3 text-zinc-600" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Pinned
                </span>
              </div>
              {pins.map((pin) => {
                const slug = pin.organizer.slug
                const isActive = pathname === `/organizer/${slug}`
                const pinInitials = pin.organizer.name
                  ? pin.organizer.name.charAt(0).toUpperCase()
                  : "?"
                return (
                  <Link
                    key={pin.id}
                    href={`/@${slug}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
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
                          {pinInitials}
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

        {/* Notifications + User */}
        <div className="p-3 border-t border-zinc-800/50 space-y-1">
          <Link
            href="/notifications"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              pathname === "/notifications"
                ? "bg-orange-500/10 text-orange-500"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            )}
          >
            <Bell className="h-5 w-5" />
            Notifications
            <span className="ml-auto w-2 h-2 rounded-full bg-orange-500" />
          </Link>

          {session?.user && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mt-1">
              <Avatar className="h-8 w-8 border border-zinc-700">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-orange-500/10 text-orange-500 text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session.user.name || "User"}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const isActive = !item.isCreate && (pathname === item.href || pathname.startsWith(item.href + "/"))

            if (item.isCreate) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center -mt-4"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                </Link>
              )
            }

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
