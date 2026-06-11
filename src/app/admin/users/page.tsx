import { redirect } from "next/navigation"
import { Users, Search } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { UserAdminRow } from "@/components/admin/user-admin-row"

interface PageProps {
  searchParams: Promise<{ q?: string; filter?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "")) redirect("/")
  const canSuper = session.user.role === "SUPER_ADMIN"

  const { q, filter } = await searchParams
  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ]
  }
  if (filter === "organizers") where.role = { in: ["ORGANIZER", "ADMIN", "SUPER_ADMIN"] }
  else if (filter === "admins") where.role = { in: ["ADMIN", "SUPER_ADMIN"] }
  else if (filter === "banned") where.banned = true

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, name: true, email: true, image: true, role: true, banned: true,
        verified: true, city: true, createdAt: true,
        _count: { select: { organizedEvents: true } },
      },
    }),
    db.user.count(),
  ])

  const filters = [
    { key: undefined, label: "All" },
    { key: "organizers", label: "Organizers" },
    { key: "admins", label: "Admins" },
    { key: "banned", label: "Banned" },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-zinc-400 mt-1">Roles, verification, and moderation.</p>
        </div>
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          <Users className="h-3 w-3 mr-1" /> {total} users
        </Badge>
      </div>

      <form action="/admin/users" className="flex flex-col sm:flex-row gap-3 mb-5">
        {filter && <input type="hidden" name="filter" value={filter} />}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or email…"
            className="w-full pl-10 rounded-lg bg-zinc-900 border border-zinc-700 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-orange-500/40"
          />
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <a
              key={f.label}
              href={`/admin/users${f.key ? `?filter=${f.key}` : ""}`}
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
              <th className="py-2.5 px-3 font-medium">User</th>
              <th className="py-2.5 pr-3 font-medium">Role</th>
              <th className="py-2.5 pr-3 font-medium">Events</th>
              <th className="py-2.5 pr-3 font-medium">Status</th>
              <th className="py-2.5 pr-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserAdminRow
                key={u.id}
                canSuper={canSuper}
                user={{
                  id: u.id, name: u.name, email: u.email, image: u.image, role: u.role,
                  banned: u.banned, verified: u.verified, city: u.city,
                  createdAt: u.createdAt.toISOString(), events: u._count.organizedEvents,
                }}
              />
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center text-sm text-zinc-500 py-10">No users match.</p>}
      </div>
    </div>
  )
}
