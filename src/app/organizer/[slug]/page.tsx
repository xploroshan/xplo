import type { Metadata } from "next"
import type { EventStatus } from "@prisma/client"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { APP_NAME, APP_URL } from "@/lib/constants"
import { OrganizerHeader } from "@/components/organizer/organizer-header"
import { OrganizerEventCard } from "@/components/organizer/organizer-event-card"
import { OrganizerPastEventCard } from "@/components/organizer/organizer-past-event-card"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}

async function getOrganizer(slug: string) {
  const organizer = await db.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      city: true,
      slug: true,
      verified: true,
      socialLinks: true,
      createdAt: true,
      role: true,
      _count: {
        select: {
          organizedEvents: true,
          followers: true,
        },
      },
    },
  })

  if (!organizer || !["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(organizer.role)) {
    return null
  }

  const [participantStats, ratingStats] = await Promise.all([
    db.eventParticipant.aggregate({
      where: { event: { organizerId: organizer.id }, status: "CONFIRMED" },
      _count: true,
    }),
    db.eventParticipant.aggregate({
      where: { event: { organizerId: organizer.id }, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  return {
    ...organizer,
    stats: {
      eventsCount: organizer._count.organizedEvents,
      followersCount: organizer._count.followers,
      totalParticipants: participantStats._count,
      avgRating: ratingStats._avg.rating,
      ratingCount: ratingStats._count.rating,
    },
  }
}

async function getEvents(organizerId: string, tab: string) {
  const statusFilter =
    tab === "past"
      ? { in: ["COMPLETED", "ARCHIVED"] as EventStatus[] }
      : { in: ["PUBLISHED", "OPEN", "ACTIVE"] as EventStatus[] }

  return db.event.findMany({
    where: { organizerId, status: statusFilter },
    orderBy: { startDate: tab === "past" ? "desc" : "asc" },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      startDate: true,
      endDate: true,
      destination: true,
      capacity: true,
      coverImage: true,
      status: true,
      price: true,
      currency: true,
      routeSummary: true,
      eventType: { select: { name: true, color: true, icon: true } },
      _count: { select: { participants: { where: { status: "CONFIRMED" } } } },
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const organizer = await getOrganizer(slug)

  if (!organizer) {
    return { title: "Organizer Not Found" }
  }

  const title = `${organizer.name} — ${APP_NAME} Organizer`
  const description = organizer.bio || `Check out events organized by ${organizer.name} on ${APP_NAME}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/@${organizer.slug}`,
      type: "profile",
      images: organizer.image ? [{ url: organizer.image }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}

export default async function OrganizerProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { tab = "upcoming" } = await searchParams
  const organizer = await getOrganizer(slug)

  if (!organizer) {
    notFound()
  }

  const session = await auth()
  const events = await getEvents(organizer.id, tab)

  // Check if current user follows/pinned this organizer
  let isFollowing = false
  let isPinned = false
  let userRegistrations: string[] = []

  if (session?.user?.id) {
    const [follow, pin, registrations] = await Promise.all([
      db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: organizer.id,
          },
        },
      }),
      db.organizerPin.findUnique({
        where: {
          userId_organizerId: {
            userId: session.user.id,
            organizerId: organizer.id,
          },
        },
      }),
      db.eventParticipant.findMany({
        where: {
          userId: session.user.id,
          eventId: { in: events.map((e) => e.id) },
          status: { not: "CANCELLED" },
        },
        select: { eventId: true },
      }),
    ])
    isFollowing = !!follow
    isPinned = !!pin
    userRegistrations = registrations.map((r) => r.eventId)
  }

  const upcomingEvents = events.map((e) => ({
    ...e,
    registeredCount: e._count.participants,
    destination: e.destination as { lat?: number; lng?: number; address?: string } | null,
    routeSummary: e.routeSummary as { distance?: string; duration?: string } | null,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <OrganizerHeader
        organizer={{
          id: organizer.id,
          name: organizer.name,
          image: organizer.image,
          bio: organizer.bio,
          city: organizer.city,
          slug: organizer.slug!,
          verified: organizer.verified,
          socialLinks: organizer.socialLinks as Record<string, string> | null,
        }}
        stats={organizer.stats}
        isFollowing={isFollowing}
        isPinned={isPinned}
        isAuthenticated={!!session?.user}
        isOwnProfile={session?.user?.id === organizer.id}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 mt-10 mb-6 border-b border-zinc-800">
        <a
          href={`/@${organizer.slug}`}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab !== "past"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Upcoming Events
        </a>
        <a
          href={`/@${organizer.slug}?tab=past`}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "past"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          Past Events
        </a>
      </div>

      {/* Events Grid */}
      {upcomingEvents.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-500">
            {tab === "past"
              ? "No past events yet."
              : "No upcoming events. Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tab === "past"
            ? upcomingEvents.map((event) => (
                <OrganizerPastEventCard key={event.id} event={event} />
              ))
            : upcomingEvents.map((event) => (
                <OrganizerEventCard
                  key={event.id}
                  event={event}
                  isRegistered={userRegistrations.includes(event.id)}
                  isAuthenticated={!!session?.user}
                  organizerSlug={organizer.slug!}
                />
              ))}
        </div>
      )}
    </div>
  )
}
