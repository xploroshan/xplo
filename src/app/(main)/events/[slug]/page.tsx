import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle2,
  Shield,
} from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { APP_NAME, APP_URL } from "@/lib/constants"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EventRegisterButton } from "@/components/organizer/event-register-button"
import { TrackView } from "@/components/analytics/track-view"
import { EventMap } from "@/components/events/event-map"
import { EventActions } from "@/components/events/event-actions"
import { RateEventForm } from "@/components/events/rate-event-form"
import { RemindButton } from "@/components/events/remind-button"
import { TicketPurchase } from "@/components/events/ticket-purchase"
import { EventSummaryCard } from "@/components/events/event-summary-card"
import { googleCalendarUrl } from "@/lib/ics"
import { Star, QrCode, ListChecks, Flag, MessageCircle, Radio, Route as RouteIcon } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

const REGISTERABLE = ["PUBLISHED", "OPEN", "ACTIVE"]

async function getEvent(slug: string) {
  return db.event.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      startDate: true,
      endDate: true,
      startLocation: true,
      destination: true,
      assemblyPoint: true,
      checklist: true,
      routeSummary: true,
      capacity: true,
      price: true,
      currency: true,
      status: true,
      coverImage: true,
      eventType: { select: { name: true, color: true, slug: true } },
      organizer: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          verified: true,
          bio: true,
          _count: { select: { organizedEvents: true } },
        },
      },
      participants: {
        where: { status: "CONFIRMED" },
        take: 16,
        select: { id: true, user: { select: { name: true, image: true } } },
      },
      _count: { select: { participants: { where: { status: "CONFIRMED" } } } },
    },
  })
}

function addressOf(json: unknown): string | null {
  return json && typeof json === "object"
    ? (json as { address?: string }).address ?? null
    : null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: "Event Not Found" }

  const title = `${event.title} — ${APP_NAME}`
  const description =
    event.description?.slice(0, 160) ||
    `Join ${event.organizer.name} for ${event.title} on ${APP_NAME}.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/events/${event.slug}`,
      type: "website",
      // og:image supplied by the co-located opengraph-image.tsx
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const session = await auth()
  let isRegistered = false
  let myParticipation: { status: string; rating: number | null; review: string | null } | null = null
  if (session?.user?.id) {
    const p = await db.eventParticipant.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
      select: { status: true, rating: true, review: true },
    })
    isRegistered = !!p && p.status !== "CANCELLED"
    myParticipation = p
  }

  // Paid ticket tiers (active). When present, they replace the free RSVP button.
  const ticketTypes = await db.ticketType.findMany({
    where: { eventId: event.id, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, description: true, price: true, quantity: true, sold: true },
  })
  const tiers = ticketTypes.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    price: Number(t.price),
    soldOut: t.quantity != null && t.sold >= t.quantity,
  }))
  const hasTickets = tiers.length > 0

  // "Remind me" state (only relevant when the event isn't open yet).
  let isReminding = false
  if (session?.user?.id && event.status === "CLOSED") {
    const r = await db.eventReminder.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
      select: { id: true },
    })
    isReminding = !!r
  }

  // Post-event reviews (shown once the ride is done)
  const isCompleted = ["COMPLETED", "ARCHIVED"].includes(event.status)
  const reviews = isCompleted
    ? await db.eventParticipant.findMany({
        where: { eventId: event.id, rating: { not: null } },
        orderBy: { joinedAt: "asc" },
        take: 20,
        select: {
          id: true,
          rating: true,
          review: true,
          user: { select: { name: true, image: true } },
        },
      })
    : []
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
      : null
  const canReview = isCompleted && myParticipation?.status === "CONFIRMED"

  const start = new Date(event.startDate)
  const dateStr = start.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const timeStr = start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

  const registeredCount = event._count.participants
  const spotsLeft = event.capacity ? Math.max(event.capacity - registeredCount, 0) : null
  const isFull = event.capacity ? registeredCount >= event.capacity : false
  const capacityPercent =
    event.capacity && event.capacity > 0
      ? Math.min((registeredCount / event.capacity) * 100, 100)
      : 0
  const priceDisplay =
    event.price && Number(event.price) > 0
      ? `${event.currency} ${Number(event.price).toLocaleString()}`
      : "Free"
  const accent = event.eventType?.color || "#f97316"
  const destinationAddress = addressOf(event.destination)
  const startAddress = addressOf(event.startLocation)
  const isOrganizer = session?.user?.id === event.organizer.id
  const assembly = (event.assemblyPoint as { address?: string; time?: string } | null) ?? {}
  const checklist = Array.isArray(event.checklist) ? (event.checklist as string[]) : []
  const isConfirmed = myParticipation?.status === "CONFIRMED"

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <TrackView name="event_viewed" eventId={event.id} />
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden border border-zinc-800/50 mb-8">
        <div
          className="relative h-[220px] sm:h-[300px]"
          style={{
            background: `linear-gradient(135deg, ${accent}20 0%, ${accent}08 40%, #09090b 100%)`,
          }}
        >
          <div
            className="absolute top-10 right-10 w-80 h-80 rounded-full blur-[100px] opacity-20"
            style={{ backgroundColor: accent }}
          />
          <div className="relative z-10 flex flex-col justify-end h-full p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {event.eventType && (
                <Badge
                  className="text-xs font-medium border-0"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  {event.eventType.name}
                </Badge>
              )}
              <Badge
                className={`text-xs border-0 ${
                  event.status === "OPEN"
                    ? "bg-green-500/20 text-green-400"
                    : event.status === "CLOSED"
                      ? "bg-zinc-500/20 text-zinc-400"
                      : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {event.status}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{event.title}</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Organized by</span>
              <Link href={`/@${event.organizer.slug}`} className="text-white font-medium hover:text-orange-400 transition-colors">
                {event.organizer.name}
              </Link>
              {event.organizer.verified && <CheckCircle2 className="h-4 w-4 text-orange-500" />}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main */}
        <div className="flex-1 space-y-6">
          {/* Key info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <Calendar className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-xs text-zinc-500 mb-0.5">Date</p>
              <p className="text-sm font-medium text-white">{dateStr}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <Clock className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-xs text-zinc-500 mb-0.5">Time</p>
              <p className="text-sm font-medium text-white">{timeStr}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <MapPin className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-xs text-zinc-500 mb-0.5">Destination</p>
              <p className="text-sm font-medium text-white truncate">{destinationAddress || "TBD"}</p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
              <Users className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-xs text-zinc-500 mb-0.5">Spots</p>
              <p className="text-sm font-medium text-white">
                {registeredCount}
                {event.capacity ? `/${event.capacity}` : ""}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <h2 className="text-base font-semibold text-white mb-3">About this event</h2>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* Route */}
          {(startAddress || destinationAddress) && (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <h2 className="text-base font-semibold text-white mb-4">Route</h2>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900" />
                  <div className="w-0.5 h-12 bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full border-2 border-zinc-900" style={{ backgroundColor: accent }} />
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Starting Point</p>
                    <p className="text-sm text-white">{startAddress || "TBD"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Destination</p>
                    <p className="text-sm text-white">{destinationAddress || "TBD"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <EventMap
                  startAddress={startAddress}
                  destinationAddress={destinationAddress}
                />
              </div>
            </div>
          )}

          {/* Assembly point — shown to confirmed riders */}
          {isConfirmed && (assembly.address || assembly.time) && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-5 w-5 text-orange-400" />
                <h3 className="text-sm font-semibold text-orange-300">Assembly point</h3>
              </div>
              {assembly.address && <p className="text-sm text-white">{assembly.address}</p>}
              {assembly.time && <p className="text-xs text-zinc-400 mt-0.5">Be there by {assembly.time}</p>}
            </div>
          )}

          {/* Pre-ride checklist */}
          {checklist.length > 0 && (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="h-5 w-5 text-orange-500" />
                <h2 className="text-base font-semibold text-white">What to bring</h2>
              </div>
              <ul className="space-y-2">
                {checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety */}
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-green-500" />
              <h3 className="text-sm font-semibold text-green-400">Safety First</h3>
            </div>
            <p className="text-xs text-zinc-400">
              All participants follow safety guidelines. Make sure your emergency contacts are
              updated in your profile before joining.
            </p>
          </div>

          {/* Participants */}
          {event.participants.length > 0 && (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Going ({registeredCount})
              </h2>
              <div className="flex flex-wrap gap-3">
                {event.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-zinc-700 text-zinc-300 text-[10px]">
                        {p.user.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-zinc-300">{p.user.name || "Rider"}</span>
                  </div>
                ))}
                {registeredCount > event.participants.length && (
                  <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
                    <span className="text-sm text-zinc-500">
                      +{registeredCount - event.participants.length} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Post-event: ride stats from GPS tracking */}
          {isCompleted && event.routeSummary != null && (() => {
            const rs = event.routeSummary as { distanceKm?: number; durationMin?: number; avgSpeedKmh?: number; maxSpeedKmh?: number }
            const stats = [
              { label: "Distance", value: rs.distanceKm != null ? `${rs.distanceKm} km` : null },
              { label: "Duration", value: rs.durationMin != null ? `${Math.floor(rs.durationMin / 60)}h ${rs.durationMin % 60}m` : null },
              { label: "Avg speed", value: rs.avgSpeedKmh != null ? `${rs.avgSpeedKmh} km/h` : null },
              { label: "Top speed", value: rs.maxSpeedKmh ? `${rs.maxSpeedKmh} km/h` : null },
            ].filter((s) => s.value)
            return stats.length > 0 ? (
              <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <RouteIcon className="h-5 w-5 text-orange-500" />
                  <h2 className="text-base font-semibold text-white">Ride stats</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.map((s) => (
                    <div key={s.label} className="text-center py-3 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                      <p className="text-lg font-bold text-white">{s.value}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          })()}

          {/* Post-event: AI recap (self-fetches; renders nothing if AI is off) */}
          {isCompleted && <EventSummaryCard eventId={event.id} />}

          {/* Post-event: leave a review */}
          {canReview && (
            <RateEventForm
              eventId={event.id}
              initialRating={myParticipation?.rating}
              initialReview={myParticipation?.review}
            />
          )}

          {/* Post-event: reviews */}
          {reviews.length > 0 && (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-semibold text-white">Reviews</h2>
                {avgRating !== null && (
                  <span className="inline-flex items-center gap-1 text-sm text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400" />
                    {avgRating.toFixed(1)}
                    <span className="text-zinc-500">({reviews.length})</span>
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-zinc-700 text-zinc-300 text-[10px]">
                        {r.user.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{r.user.name || "Rider"}</span>
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" />
                          {r.rating}
                        </span>
                      </div>
                      {r.review && (
                        <p className="text-sm text-zinc-400 mt-0.5 leading-relaxed">{r.review}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Join card */}
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6">
              <div className="text-center mb-4">
                <span className={`text-2xl font-bold ${priceDisplay !== "Free" ? "text-white" : "text-green-400"}`}>
                  {priceDisplay}
                </span>
                {priceDisplay !== "Free" && (
                  <span className="text-sm text-zinc-500 ml-1">per person</span>
                )}
              </div>

              {event.capacity && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-zinc-400">{registeredCount} going</span>
                    <span className={isFull ? "text-red-400 font-medium" : "text-zinc-500"}>
                      {isFull ? "Full" : `${spotsLeft} spots left`}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${capacityPercent}%`, backgroundColor: isFull ? "#ef4444" : accent }}
                    />
                  </div>
                </div>
              )}

              {isOrganizer ? (
                <Link href={`/events/${event.slug}/manage`}>
                  <Button variant="glow" className="w-full rounded-xl">
                    Manage event
                  </Button>
                </Link>
              ) : REGISTERABLE.includes(event.status) ? (
                <div className="space-y-2">
                  {hasTickets && !isConfirmed ? (
                    <TicketPurchase
                      eventId={event.id}
                      ticketTypes={tiers}
                      isAuthenticated={!!session?.user}
                      buyer={{ name: session?.user?.name, email: session?.user?.email }}
                    />
                  ) : (
                    <EventRegisterButton
                      eventId={event.id}
                      isRegistered={isRegistered}
                      isAuthenticated={!!session?.user}
                      isFull={isFull}
                      organizerSlug={event.organizer.slug || ""}
                    />
                  )}
                  {myParticipation?.status === "CONFIRMED" && (
                    <Link href={`/events/${event.slug}/pass`}>
                      <Button variant="outline" className="w-full rounded-xl border-zinc-700 gap-2">
                        <QrCode className="h-4 w-4" />
                        View my pass
                      </Button>
                    </Link>
                  )}
                </div>
              ) : event.status === "CLOSED" ? (
                <RemindButton
                  eventId={event.id}
                  isAuthenticated={!!session?.user}
                  initialReminding={isReminding}
                />
              ) : (
                <Button disabled className="w-full rounded-xl">
                  Registration closed
                </Button>
              )}

              {(isConfirmed || isOrganizer) && (
                <>
                  <Link href={`/events/${event.slug}/chat`} className="block mt-2">
                    <Button variant="outline" className="w-full rounded-xl border-zinc-700 gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Group chat
                    </Button>
                  </Link>
                  {(event.status === "ACTIVE" || isOrganizer) && event.status !== "COMPLETED" && event.status !== "ARCHIVED" && (
                    <Link href={`/events/${event.slug}/live`} className="block mt-2">
                      <Button
                        variant="outline"
                        className={`w-full rounded-xl gap-2 ${
                          event.status === "ACTIVE"
                            ? "border-green-500/40 text-green-400"
                            : "border-zinc-700"
                        }`}
                      >
                        <Radio className="h-4 w-4" />
                        {event.status === "ACTIVE" ? "Live ride map" : "Ride map (start here)"}
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Share + calendar */}
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Share & save
              </h3>
              <EventActions
                eventId={event.id}
                slug={event.slug}
                title={event.title}
                whenText={`${dateStr}, ${timeStr}`}
                googleCalUrl={googleCalendarUrl({
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  start: new Date(event.startDate),
                  end: event.endDate ? new Date(event.endDate) : null,
                  location: destinationAddress ?? startAddress,
                  url: `${APP_URL}/events/${event.slug}`,
                })}
              />
            </div>

            {/* Organizer card */}
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-orange-500/10 text-orange-500 font-bold">
                    {event.organizer.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-white">{event.organizer.name}</span>
                    {event.organizer.verified && <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {event.organizer._count.organizedEvents} events
                  </span>
                </div>
              </div>
              {event.organizer.bio && (
                <p className="text-xs text-zinc-400 mb-3">{event.organizer.bio}</p>
              )}
              <Link href={`/@${event.organizer.slug}`}>
                <Button variant="outline" className="w-full rounded-xl border-zinc-700 text-sm">
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
