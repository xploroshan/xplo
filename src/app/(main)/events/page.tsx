import type { Metadata } from "next"
import Link from "next/link"
import { MapPin, Compass, SlidersHorizontal, Search, List, Map as MapIcon, CalendarDays } from "lucide-react"
import type { EventStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { APP_NAME, APP_URL } from "@/lib/constants"
import { EventCard } from "@/components/events/event-card"
import { PopularOrganizers } from "@/components/events/popular-organizers"
import { EventsMapView, type MapEvent } from "@/components/events/events-map-view"
import { EventCalendar, type CalendarEvent } from "@/components/events/event-calendar"
import { CityAutoDetect } from "@/components/events/city-auto-detect"
import type { MockEvent, MockOrganizer } from "@/lib/mock-data"

const ACTIVE: EventStatus[] = ["PUBLISHED", "OPEN", "ACTIVE"]

// Quick-filter chip styling.
function chip(active: boolean): string {
  return `px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
    active
      ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
      : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
  }`
}

interface PageProps {
  searchParams: Promise<{
    city?: string
    type?: string
    q?: string
    view?: string
    price?: string
    avail?: string
  }>
}

type DbEvent = Awaited<ReturnType<typeof getEvents>>[number]

async function getEvents(where: object) {
  return db.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    take: 48,
    select: {
      id: true,
      title: true,
      slug: true,
      startDate: true,
      endDate: true,
      destination: true,
      capacity: true,
      price: true,
      currency: true,
      coverImage: true,
      status: true,
      featured: true,
      eventType: { select: { name: true, slug: true, icon: true, color: true } },
      organizer: { select: { id: true, name: true, slug: true, image: true, verified: true, city: true } },
      participants: {
        where: { status: "CONFIRMED" },
        take: 3,
        select: { id: true, user: { select: { name: true, image: true } } },
      },
      _count: { select: { participants: { where: { status: "CONFIRMED" } } } },
    },
  })
}

// Adapt a DB event to the shape EventCard renders (reuses the polished card).
function toCardEvent(e: DbEvent): MockEvent {
  const organizer: MockOrganizer = {
    id: e.organizer.id,
    name: e.organizer.name || "Organizer",
    slug: e.organizer.slug || "",
    image: e.organizer.image,
    verified: e.organizer.verified,
    bio: "",
    city: e.organizer.city || "",
    eventCount: 0,
    followerCount: 0,
    rating: 0,
  }
  const dest = (e.destination as { address?: string } | null) || {}
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: "",
    startDate: new Date(e.startDate).toISOString(),
    endDate: e.endDate ? new Date(e.endDate).toISOString() : null,
    city: e.organizer.city || "",
    country: "India",
    startLocation: { address: "" },
    destination: { address: dest.address || "Location TBD" },
    capacity: e.capacity ?? 0,
    registeredCount: e._count.participants,
    price: e.price ? Number(e.price) : 0,
    currency: e.currency,
    coverImage: e.coverImage,
    status: e.status,
    featured: e.featured,
    eventType: e.eventType ?? { name: "Event", slug: "", icon: "", color: "#f97316" },
    organizer,
    participants: e.participants.map((p) => ({
      id: p.id,
      name: p.user.name || "Rider",
      image: p.user.image,
    })),
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { city, type } = await searchParams
  const eventType = type
    ? await db.eventType.findUnique({ where: { slug: type }, select: { name: true } })
    : null
  const what = eventType?.name ?? "Adventure events & rides"
  const where = city ? ` in ${city}` : ""
  const title = `${what}${where} — ${APP_NAME}`
  const description = `Discover and join ${eventType?.name?.toLowerCase() ?? "rides, treks and group adventures"}${where ? ` around ${city}` : " near you"} on ${APP_NAME}.`
  const qs = new URLSearchParams()
  if (city) qs.set("city", city)
  if (type) qs.set("type", type)
  return {
    title,
    description,
    alternates: { canonical: `${APP_URL}/events${qs.toString() ? `?${qs}` : ""}` },
    openGraph: { title, description, url: `${APP_URL}/events`, type: "website" },
  }
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { city, type, q, view, price, avail } = await searchParams

  const and: object[] = []
  const where: Record<string, unknown> = { status: { in: ACTIVE }, AND: and }
  if (type) where.eventType = { slug: type }
  if (city) where.organizer = { city: { equals: city, mode: "insensitive" } }
  // Search across title + description (case-insensitive).
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    })
  }
  // Price filter: free = null/0, paid = > 0.
  if (price === "free") and.push({ OR: [{ price: null }, { price: 0 }] })
  else if (price === "paid") and.push({ price: { gt: 0 } })

  const hasFilters = Boolean(city || type || q || price || avail)

  const [events, types, cityRows, topOrganizers, featuredRaw] = await Promise.all([
    getEvents(where),
    db.eventType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { name: true, slug: true, color: true } }),
    db.$queryRaw<{ city: string; count: number }[]>`
      select u.city as city, count(e.id)::int as count
      from "Event" e join "User" u on e."organizerId" = u.id
      where e.status in ('PUBLISHED','OPEN','ACTIVE') and u.city is not null
      group by u.city order by count desc limit 8`,
    db.user.findMany({
      where: { role: { in: ["ORGANIZER", "ADMIN", "SUPER_ADMIN"] }, organizedEvents: { some: { status: { in: ACTIVE } } } },
      orderBy: { followers: { _count: "desc" } },
      take: 5,
      select: {
        id: true, name: true, slug: true, image: true, verified: true, city: true,
        _count: { select: { organizedEvents: true, followers: true } },
      },
    }),
    hasFilters
      ? Promise.resolve([])
      : getEvents({ status: { in: ACTIVE }, featured: true }),
  ])

  const allCardEvents = events.map(toCardEvent)
  // Availability filter (open = has spots left). Done post-query since it needs
  // the confirmed count vs capacity.
  const cardEvents =
    avail === "open"
      ? allCardEvents.filter((e) => !e.capacity || e.registeredCount < e.capacity)
      : allCardEvents
  const featured = (featuredRaw as DbEvent[]).map(toCardEvent).slice(0, 4)

  // Map view data.
  const mapEvents: MapEvent[] =
    view === "map"
      ? cardEvents
          .filter((e) => e.destination.address && e.destination.address !== "Location TBD")
          .map((e) => ({
            slug: e.slug,
            title: e.title,
            address: e.destination.address,
            dateText: new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            typeColor: e.eventType.color,
          }))
      : []

  // Calendar view data (the signed-in user's events).
  let calendarEvents: CalendarEvent[] = []
  if (view === "calendar") {
    const session = await auth()
    if (session?.user?.id) {
      const [parts, organized] = await Promise.all([
        db.eventParticipant.findMany({
          where: { userId: session.user.id, status: { not: "CANCELLED" } },
          select: { event: { select: { slug: true, title: true, startDate: true, eventType: { select: { color: true } } } } },
        }),
        db.event.findMany({
          where: { organizerId: session.user.id },
          select: { slug: true, title: true, startDate: true, eventType: { select: { color: true } } },
        }),
      ])
      const seen = new Set<string>()
      calendarEvents = [
        ...parts.map((p) => ({ ...p.event, role: "going" as const })),
        ...organized.map((e) => ({ ...e, role: "organizing" as const })),
      ]
        .filter((e) => (seen.has(e.slug) ? false : (seen.add(e.slug), true)))
        .map((e) => ({
          slug: e.slug,
          title: e.title,
          date: new Date(e.startDate).toISOString(),
          color: e.eventType?.color,
          role: e.role,
        }))
    }
  }

  const popularOrganizers: MockOrganizer[] = topOrganizers.map((o) => ({
    id: o.id,
    name: o.name || "Organizer",
    slug: o.slug || "",
    image: o.image,
    verified: o.verified,
    bio: "",
    city: o.city || "",
    eventCount: o._count.organizedEvents,
    followerCount: o._count.followers,
    rating: 0,
  }))

  // Build a query string preserving the other active filters.
  const href = (patch: Partial<{ city: string; type: string; q: string; view: string; price: string; avail: string }>) => {
    const next = { city, type, q, view, price, avail, ...patch }
    const qs = new URLSearchParams()
    if (next.city) qs.set("city", next.city)
    if (next.type) qs.set("type", next.type)
    if (next.q) qs.set("q", next.q)
    if (next.view) qs.set("view", next.view)
    if (next.price) qs.set("price", next.price)
    if (next.avail) qs.set("avail", next.avail)
    const s = qs.toString()
    return s ? `/events?${s}` : "/events"
  }

  const viewModes = [
    { key: undefined as string | undefined, label: "List", icon: List },
    { key: "map", label: "Map", icon: MapIcon },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
  ]

  // SEO: ItemList of the events on this page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: cardEvents.slice(0, 20).map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${APP_URL}/events/${e.slug}`,
      name: e.title,
    })),
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <div className="text-center space-y-2 pt-2 pb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {type ? `${types.find((t) => t.slug === type)?.name ?? "Events"}` : "Discover Adventures"}
          {city ? <span className="text-orange-400"> in {city}</span> : " Near You"}
        </h1>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
          Find rides, treks and group adventures by city and activity.
        </p>
      </div>

      {/* City auto-detect suggestion (only when no city is chosen) */}
      {!city && <CityAutoDetect />}

      {/* Search */}
      <form action="/events" method="get" className="flex items-center gap-2 max-w-xl mx-auto">
        {view && <input type="hidden" name="view" value={view} />}
        {city && <input type="hidden" name="city" value={city} />}
        {type && <input type="hidden" name="type" value={type} />}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search events..."
            className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800 pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-orange-500/40"
          />
        </div>
        <button type="submit" className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Link
          href={href({ type: undefined })}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            !type ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
          }`}
        >
          All
        </Link>
        {types.map((t) => (
          <Link
            key={t.slug}
            href={href({ type: t.slug })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              type === t.slug ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
            }`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {/* City chips */}
      {cityRows.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-zinc-500 shrink-0 mr-1">Cities:</span>
          {cityRows.map((c) => (
            <Link
              key={c.city}
              href={href({ city: city === c.city ? undefined : c.city })}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                city === c.city ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
              }`}
            >
              <MapPin className="h-3 w-3" />
              {c.city}
              <span className="text-[10px] opacity-60">{c.count}</span>
            </Link>
          ))}
        </div>
      )}

      {/* View toggle + quick filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900/50 p-0.5">
          {viewModes.map((v) => {
            const active = (view ?? undefined) === v.key
            return (
              <Link
                key={v.label}
                href={href({ view: v.key })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active ? "bg-orange-500/15 text-orange-400" : "text-zinc-400 hover:text-white"
                }`}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </Link>
            )
          })}
        </div>

        {view !== "calendar" && (
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            <Link href={href({ price: price === "free" ? undefined : "free" })} className={chip(price === "free")}>Free</Link>
            <Link href={href({ price: price === "paid" ? undefined : "paid" })} className={chip(price === "paid")}>Paid</Link>
            <Link href={href({ avail: avail === "open" ? undefined : "open" })} className={chip(avail === "open")}>Has spots</Link>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-8">
          {view === "map" ? (
            cardEvents.length > 0 ? (
              <EventsMapView events={mapEvents} />
            ) : (
              <p className="text-center text-sm text-zinc-500 py-16">No events to map.</p>
            )
          ) : view === "calendar" ? (
            <EventCalendar events={calendarEvents} />
          ) : (
            <>
          {/* Featured (discovery mode only) */}
          {!hasFilters && featured.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Featured</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5">
                {featured.map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white">
                {hasFilters ? "Matching Events" : "All Events"}
              </h2>
              <span className="text-xs text-zinc-500">{cardEvents.length} found</span>
              {hasFilters && (
                <Link href="/events" className="ml-auto text-xs text-orange-400 hover:text-orange-300">
                  Clear filters
                </Link>
              )}
            </div>

            {cardEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {cardEvents.map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                  <Compass className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
                <p className="text-sm text-zinc-400 mb-4">Try a different city or activity.</p>
                <Link href="/events" className="inline-block px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium">
                  Clear filters
                </Link>
              </div>
            )}
          </section>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-6">
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-orange-500" />
              Events by City
            </h3>
            <div className="space-y-1">
              {cityRows.map((c) => (
                <Link
                  key={c.city}
                  href={href({ city: c.city })}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors text-left group"
                >
                  <span className="flex items-center gap-2 text-sm text-zinc-400 group-hover:text-white">
                    <MapPin className="h-3 w-3 text-zinc-600" />
                    {c.city}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">{c.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {popularOrganizers.length > 0 && <PopularOrganizers organizers={popularOrganizers} />}
        </aside>
      </div>
    </div>
  )
}
