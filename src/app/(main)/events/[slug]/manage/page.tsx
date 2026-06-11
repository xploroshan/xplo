import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { ManageDashboard } from "@/components/organizer/manage-dashboard"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata = { title: "Manage event — HYKRZ" }

function addressOf(json: unknown): string {
  return json && typeof json === "object"
    ? (json as { address?: string }).address ?? ""
    : ""
}

export default async function ManageEventPage({ params }: PageProps) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const event = await db.event.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      startDate: true,
      endDate: true,
      capacity: true,
      price: true,
      status: true,
      requiresApproval: true,
      coverImage: true,
      startLocation: true,
      destination: true,
      organizerId: true,
    },
  })
  if (!event) notFound()

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
  // 404 (not 403) for non-organizers so the page's existence isn't leaked.
  if (event.organizerId !== session.user.id && !isAdmin) notFound()

  const participants = await db.eventParticipant.findMany({
    where: { eventId: event.id, status: { not: "CANCELLED" } },
    orderBy: [{ status: "asc" }, { joinedAt: "asc" }],
    select: {
      id: true,
      status: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true, image: true, slug: true, city: true } },
    },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href={`/events/${event.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to event
      </Link>

      <ManageDashboard
        event={{
          id: event.id,
          slug: event.slug,
          title: event.title,
          description: event.description ?? "",
          startDate: event.startDate.toISOString(),
          endDate: event.endDate ? event.endDate.toISOString() : "",
          capacity: event.capacity,
          price: event.price ? Number(event.price) : null,
          status: event.status,
          requiresApproval: event.requiresApproval,
          coverImage: event.coverImage,
          startLocationAddress: addressOf(event.startLocation),
          destinationAddress: addressOf(event.destination),
        }}
        initialParticipants={participants.map((p) => ({
          id: p.id,
          status: p.status,
          role: p.role,
          joinedAt: p.joinedAt.toISOString(),
          user: p.user,
        }))}
      />
    </div>
  )
}
