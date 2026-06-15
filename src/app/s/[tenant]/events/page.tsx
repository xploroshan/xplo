import { notFound } from "next/navigation"
import { resolveTenant } from "@/lib/tenant"
import { getEvents, toCardEvent } from "@/app/(main)/events/page"
import { tenantEventsWhere } from "@/app/s/[tenant]/page"
import { EventCard } from "@/components/events/event-card"

export const metadata = { title: "Events" }

export default async function TenantEvents({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: label } = await params
  const tenant = await resolveTenant(label)
  if (!tenant) notFound()

  const rows = await getEvents(tenantEventsWhere(tenant), 60)
  const events = rows.map(toCardEvent)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">Events</h1>
      <p className="text-sm text-zinc-400 mb-6">{events.length} event{events.length === 1 ? "" : "s"} from {tenant.name}</p>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 py-16 text-center text-zinc-500">
          No events yet.
        </div>
      )}
    </div>
  )
}
