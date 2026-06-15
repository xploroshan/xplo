"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// Microsite top nav. Links are root-relative so they stay on the tenant
// subdomain (the proxy rewrites them into /s/<tenant>/...).
const LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Blog" },
  { href: "/guidelines", label: "Guidelines" },
]

export function TenantNav({ isOwner = false }: { isOwner?: boolean }) {
  const pathname = usePathname()
  const links = isOwner ? [...LINKS, { href: "/manage", label: "Manage" }] : LINKS
  // On the rewritten path the pathname is /s/<tenant>/..., so match by suffix.
  const within = (href: string, exact?: boolean) => {
    const norm = pathname.replace(/^\/s\/[^/]+/, "") || "/"
    return exact ? norm === href : norm === href || norm.startsWith(href + "/")
  }
  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            within(l.href, l.exact)
              ? "bg-primary/15 text-primary"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
