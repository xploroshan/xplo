import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, CalendarDays } from "lucide-react"
import { resolveTenant, type Tenant } from "@/lib/tenant"
import { getEvents, toCardEvent } from "@/app/(main)/events/page"
import { EventCard } from "@/components/events/event-card"
import { Button } from "@/components/ui/button"

const PUBLIC_STATUSES = ["PUBLISHED", "OPEN", "CLOSED", "ACTIVE", "COMPLETED"]

// Events owned by this tenant (org → organizationId, individual → organizerId).
export function tenantEventsWhere(tenant: Tenant, extra: Record<string, unknown> = {}) {
  const owner = tenant.kind === "org" ? { organizationId: tenant.id } : { organizerId: tenant.id }
  return { ...owner, status: { in: PUBLIC_STATUSES }, ...extra }
}

export default async function TenantHome({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: label } = await params
  const tenant = await resolveTenant(label)
  if (!tenant) notFound()

  const rows = await getEvents(tenantEventsWhere(tenant, { startDate: { gte: new Date() } }), 6)
  const upcoming = rows.map(toCardEvent)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800/60">
        {tenant.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/60 to-background" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">{tenant.name}</h1>
          {tenant.tagline && (
            <p className="mt-4 text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto">{tenant.tagline}</p>
          )}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/events">
              <Button variant="glow" size="lg" className="rounded-2xl">
                Browse events <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Upcoming
          </h2>
          <Link href="/events" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 py-16 text-center text-zinc-500">
            No upcoming events right now — check back soon.
          </div>
        )}

        {tenant.description && (
          <div className="mt-12 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6">
            <h2 className="text-base font-semibold text-white mb-2">About</h2>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{tenant.description}</p>
          </div>
        )}
      </section>
    </div>
  )
}
