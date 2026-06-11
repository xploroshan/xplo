import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { summarizeTrail } from "@/lib/geo"

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
  assemblyPointAddress: z.string().nullable().optional(),
  assemblyPointTime: z.string().nullable().optional(),
  checklist: z.array(z.string().min(1).max(120)).max(30).nullable().optional(),
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
    select: { id: true, slug: true, title: true, organizerId: true, startDate: true, status: true },
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
  if (d.assemblyPointAddress !== undefined || d.assemblyPointTime !== undefined) {
    data.assemblyPoint =
      d.assemblyPointAddress || d.assemblyPointTime
        ? { address: d.assemblyPointAddress ?? undefined, time: d.assemblyPointTime ?? undefined }
        : undefined
  }
  if (d.checklist !== undefined) {
    data.checklist = d.checklist && d.checklist.length > 0 ? d.checklist : undefined
  }

  const updated = await db.event.update({
    where: { id: event.id },
    data,
    select: { id: true, slug: true },
  })

  // Ride finished → compute the route summary from the best GPS trail
  // (FR-4.23). Pilot's trail preferred; falls back to the longest one.
  if (d.status === "COMPLETED" && event.status !== "COMPLETED") {
    const pilot = await db.eventParticipant.findFirst({
      where: { eventId: event.id, role: "PILOT", status: "CONFIRMED" },
      select: { userId: true },
    })
    let trail = pilot
      ? await db.locationPing.findMany({
          where: { eventId: event.id, userId: pilot.userId },
          orderBy: { recordedAt: "asc" },
          take: 2000,
          select: { lat: true, lng: true, recordedAt: true },
        })
      : []
    if (trail.length < 2) {
      // No pilot trail — use whoever logged the most pings.
      const counts = await db.locationPing.groupBy({
        by: ["userId"],
        where: { eventId: event.id },
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: 1,
      })
      if (counts[0]) {
        trail = await db.locationPing.findMany({
          where: { eventId: event.id, userId: counts[0].userId },
          orderBy: { recordedAt: "asc" },
          take: 2000,
          select: { lat: true, lng: true, recordedAt: true },
        })
      }
    }
    const summary = summarizeTrail(trail)
    if (summary) {
      await db.event.update({
        where: { id: event.id },
        data: { routeSummary: summary as object },
      })
    }
  }

  // When the event (re)opens, fire any "remind me" reminders, then clear them.
  if (d.status === "OPEN" && event.status !== "OPEN") {
    const reminders = await db.eventReminder.findMany({
      where: { eventId: event.id },
      select: { userId: true },
    })
    if (reminders.length > 0) {
      await db.notification.createMany({
        data: reminders.map((r) => ({
          type: "EVENT_REMINDER" as const,
          title: "Registration is open!",
          content: `"${d.title ?? event.title}" is now open for registration — grab a spot`,
          link: `/events/${updated.slug}`,
          userId: r.userId,
          senderId: session.user!.id,
        })),
      })
      await db.eventReminder.deleteMany({ where: { eventId: event.id } })
    }
  }

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
