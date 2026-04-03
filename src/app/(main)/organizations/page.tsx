"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Search,
  BadgeCheck,
  Star,
  Calendar,
  Users,
  Plus,
  Loader2,
  Building2,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Filter = "all" | "featured" | "verified"

interface Organization {
  id: string
  name: string
  slug: string
  logo?: string | null
  description?: string | null
  verified: boolean
  featured?: boolean
  avgRating: number | null
  eventCount: number
  memberCount: number
}

const filters: { key: Filter; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All", icon: Building2 },
  { key: "featured", label: "Featured", icon: Sparkles },
  { key: "verified", label: "Verified", icon: ShieldCheck },
]

export default function BrowseOrganizationsPage() {
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrgs() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.set("search", search)
        if (filter !== "all") params.set("filter", filter)
        const res = await fetch(`/api/organizations?${params.toString()}`)
        if (!res.ok) throw new Error("Failed to load")
        const data = await res.json()
        setOrgs(Array.isArray(data) ? data : data.organizations ?? [])
      } catch {
        setOrgs([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchOrgs, 300)
    return () => clearTimeout(debounce)
  }, [search, filter])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Organizations</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Discover adventure organizations and communities
            </p>
          </div>
          {session?.user && (
            <Link href="/organizations/create">
              <Button variant="glow">
                <Plus className="h-4 w-4" />
                Create Organization
              </Button>
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations..."
              className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  filter === f.key
                    ? "bg-zinc-800 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : orgs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org, index) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/org/${org.slug}`} className="group block">
                  <div className="overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5 transition-all duration-300 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20 group-hover:-translate-y-1">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                        {org.logo ? (
                          <Image
                            src={org.logo}
                            alt={org.name}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-zinc-500">
                            {org.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-base font-semibold text-white group-hover:text-orange-400 transition-colors">
                            {org.name}
                          </h3>
                          {org.verified && (
                            <BadgeCheck className="h-4 w-4 flex-shrink-0 text-blue-500" />
                          )}
                        </div>
                        {org.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                            {org.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 border-t border-zinc-800 pt-3">
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {org.eventCount} events
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Users className="h-3.5 w-3.5" />
                        {org.memberCount} members
                      </div>
                      {org.avgRating !== null && (
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                          <span className="font-medium text-white">
                            {org.avgRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-20 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="text-zinc-400">No organizations found</p>
            <p className="mt-1 text-sm text-zinc-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
