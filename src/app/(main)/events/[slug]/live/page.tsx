import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getEventChatAccess } from "@/lib/chat"
import { realtimeEnabled } from "@/lib/realtime"
import { LiveMap } from "@/components/events/live-map"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata = { title: "Live ride — HYKRZ" }

// The live group map (FR-3.14 / FR-4): riders share location during an ACTIVE
// ride; Pilot's path paints green, Sweep's red. Members + organizer only.
export default async function LiveRidePage({ params }: PageProps) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const event = await db.event.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, status: true, organizerId: true },
  })
  if (!event) notFound()

  const access = await getEventChatAccess(event.id, session.user.id, session.user.role)
  if (!access) notFound()

  const isOrganizer = access.role === "ORGANIZER"

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href={`/events/${event.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to event
      </Link>
      <h1 className="text-xl font-bold text-white mb-1">{event.title}</h1>
      <p className="text-sm text-zinc-500 mb-5">
        Live ride map — share your location so the group can see each other.
      </p>

      <LiveMap
        eventId={event.id}
        isOrganizer={isOrganizer}
        initialStatus={event.status}
        realtime={realtimeEnabled()}
      />
    </div>
  )
}
