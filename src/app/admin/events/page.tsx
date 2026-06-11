import { redirect } from "next/navigation"
import { Calendar, Search } from "lucide-react"
import type { EventStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { EventAdminRow } from "@/components/admin/event-admin-row"

interface PageProps {
  searchParams: Promise<{ q?: string; filter?: string }>
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) redirect("/")

  const { q, filter } = await searchParams
  const where: Record<string, unknown> = {}
  if (q) where.title = { contains: q, mode: "insensitive" }
  if (filter === "featured") where.featured = true
  else if (filter === "live") where.status = { in: ["OPEN", "ACTIVE"] as EventStatus[] }
  else if (filter === "archived") where.status = "ARCHIVED"

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, slug: true, title: true, status: true, featured: true, startDate: true,
        organizer: { select: { name: true } },
        _count: { select: { participants: { where: { status: "CONFIRMED" } } } },
      },
    }),
    db.event.count(),
  ])

  const filters = [
    { key: undefined, label: "All" },
    { key: "featured", label: "Featured" },
    { key: "live", label: "Live" },
    { key: "archived", label: "Archived" },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Event Management</h1>
          <p className="text-zinc-400 mt-1">Feature, moderate, and archive events.</p>
        </div>
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          <Calendar className="h-3 w-3 mr-1" /> {total} events
        </Badge>
      </div>

      <form action="/admin/events" className="flex flex-col sm:flex-row gap-3 mb-5">
        {filter && <input type="hidden" name="filter" value={filter} />}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search events…"
            className="w-full pl-10 rounded-lg bg-zinc-900 border border-zinc-700 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-orange-500/40"
          />
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <a
              key={f.label}
              href={`/admin/events${f.key ? `?filter=${f.key}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                (filter ?? undefined) === f.key
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                  : "border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </form>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <th className="py-2.5 px-3 font-medium">Event</th>
              <th className="py-2.5 pr-3 font-medium">Status</th>
              <th className="py-2.5 pr-3 font-medium">Going</th>
              <th className="py-2.5 pr-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <EventAdminRow
                key={e.id}
                event={{
                  id: e.id, slug: e.slug, title: e.title, status: e.status, featured: e.featured,
                  organizerName: e.organizer.name, participants: e._count.participants,
                  startDate: e.startDate.toISOString(),
                }}
              />
            ))}
          </tbody>
        </table>
        {events.length === 0 && <p className="text-center text-sm text-zinc-500 py-10">No events match.</p>}
      </div>
    </div>
  )
}
