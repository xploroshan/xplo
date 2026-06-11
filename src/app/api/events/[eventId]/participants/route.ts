import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendEmail, rsvpConfirmationEmail, appUrl } from "@/lib/email"

// Confirms the caller may manage this event (its organizer, or a platform admin).
async function loadManageableEvent(eventId: string, userId: string, userRole?: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, slug: true, organizerId: true, startDate: true },
  })
  if (!event) return { error: "not_found" as const }
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
  if (event.organizerId !== userId && !isAdmin) return { error: "forbidden" as const }
  return { event }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params
  const res = await loadManageableEvent(eventId, session.user.id, session.user.role)
  if ("error" in res) {
    return NextResponse.json(
      { error: res.error === "not_found" ? "Event not found" : "Forbidden" },
      { status: res.error === "not_found" ? 404 : 403 }
    )
  }

  const participants = await db.eventParticipant.findMany({
    where: { eventId, status: { not: "CANCELLED" } },
    orderBy: [{ status: "asc" }, { joinedAt: "asc" }],
    select: {
      id: true,
      status: true,
      role: true,
      joinedAt: true,
      rating: true,
      user: { select: { id: true, name: true, image: true, slug: true, city: true } },
    },
  })

  return NextResponse.json({ participants })
}

const patchBody = z.object({
  participantId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED"]).optional(),
  role: z.enum(["MEMBER", "PILOT", "SWEEP", "MODERATOR"]).optional(),
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
  const res = await loadManageableEvent(eventId, session.user.id, session.user.role)
  if ("error" in res) {
    return NextResponse.json(
      { error: res.error === "not_found" ? "Event not found" : "Forbidden" },
      { status: res.error === "not_found" ? 404 : 403 }
    )
  }
  const event = res.event

  const parsed = patchBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }
  const { participantId, status, role } = parsed.data
  if (!status && !role) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const participant = await db.eventParticipant.findFirst({
    where: { id: participantId, eventId },
    include: { user: { select: { id: true, email: true, name: true } } },
  })
  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 })
  }

  const updated = await db.eventParticipant.update({
    where: { id: participant.id },
    data: { ...(status ? { status } : {}), ...(role ? { role } : {}) },
    select: { id: true, status: true, role: true },
  })

  // Tell the participant when their RSVP status changes meaningfully.
  if (status && status !== participant.status) {
    const eventUrl = `${appUrl()}/events/${event.slug}`
    if (status === "CONFIRMED") {
      await db.notification.create({
        data: {
          type: "RSVP_CONFIRMATION",
          title: "You're confirmed!",
          content: `The organizer confirmed your spot for "${event.title}"`,
          link: `/events/${event.slug}`,
          userId: participant.user.id,
        },
      })
      if (participant.user.email) {
        const { subject, html, text } = rsvpConfirmationEmail({
          eventTitle: event.title,
          eventUrl,
          whenText: new Intl.DateTimeFormat("en-IN", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
          }).format(event.startDate),
          status: "CONFIRMED",
        })
        await sendEmail({ to: participant.user.email, subject, html, text })
      }
    } else if (status === "CANCELLED") {
      await db.notification.create({
        data: {
          type: "EVENT_UPDATE",
          title: "Registration declined",
          content: `Your registration for "${event.title}" was not accepted`,
          link: `/events/${event.slug}`,
          userId: participant.user.id,
        },
      })
    }
  }

  return NextResponse.json({ participant: updated })
}
