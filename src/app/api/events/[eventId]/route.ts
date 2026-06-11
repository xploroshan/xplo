import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const EVENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "OPEN",
  "CLOSED",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
] as const

const patchBody = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(5000).nullable().optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  requiresApproval: z.boolean().optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  coverImage: z.string().url().nullable().optional(),
  startLocationAddress: z.string().nullable().optional(),
  destinationAddress: z.string().nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, slug: true, title: true, organizerId: true, startDate: true },
  })
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
  if (event.organizerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = patchBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }
  const d = parsed.data

  const data: Record<string, unknown> = {}
  if (d.title !== undefined) data.title = d.title
  if (d.description !== undefined) data.description = d.description
  if (d.startDate !== undefined) data.startDate = new Date(d.startDate)
  if (d.endDate !== undefined) data.endDate = d.endDate ? new Date(d.endDate) : null
  if (d.capacity !== undefined) data.capacity = d.capacity
  if (d.price !== undefined) data.price = d.price
  if (d.requiresApproval !== undefined) data.requiresApproval = d.requiresApproval
  if (d.status !== undefined) data.status = d.status
  if (d.coverImage !== undefined) data.coverImage = d.coverImage
  if (d.startLocationAddress !== undefined) {
    data.startLocation = d.startLocationAddress ? { address: d.startLocationAddress } : undefined
  }
  if (d.destinationAddress !== undefined) {
    data.destination = d.destinationAddress ? { address: d.destinationAddress } : undefined
  }

  const updated = await db.event.update({
    where: { id: event.id },
    data,
    select: { id: true, slug: true },
  })

  // If the date moved, let confirmed participants know (FR-2.17).
  const dateChanged =
    d.startDate !== undefined &&
    new Date(d.startDate).getTime() !== event.startDate.getTime()
  if (dateChanged) {
    const confirmed = await db.eventParticipant.findMany({
      where: { eventId: event.id, status: "CONFIRMED" },
      select: { userId: true },
    })
    if (confirmed.length > 0) {
      await db.notification.createMany({
        data: confirmed.map((p) => ({
          type: "EVENT_UPDATE" as const,
          title: "Event details changed",
          content: `"${d.title ?? event.title}" was updated — check the new details`,
          link: `/events/${updated.slug}`,
          userId: p.userId,
          senderId: session.user!.id,
        })),
      })
    }
  }

  return NextResponse.json({ event: updated })
}
