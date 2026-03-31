"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Tags,
  Settings,
  Shield,
  Compass,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Events", href: "/admin/events", icon: Calendar },
  { label: "Event Types", href: "/admin/event-types", icon: Tags },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Admin Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-800/50 bg-zinc-950">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Admin</span>
              <p className="text-[10px] text-zinc-500 -mt-0.5">Super Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {adminNav.map((item) => {
            const isActive = pathname === item.href
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
                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
          >
            <Compass className="h-5 w-5" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
