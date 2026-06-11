import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { track } from "@/lib/analytics"
import { buildIcs } from "@/lib/ics"
import {
  sendEmail,
  rsvpConfirmationEmail,
  appUrl,
} from "@/lib/email"

function addressOf(json: unknown): string | null {
  if (json && typeof json === "object" && "address" in json) {
    const a = (json as { address?: unknown }).address
    return typeof a === "string" ? a : null
  }
  return null
}

function whenText(start: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(start)
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    const event = await db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        capacity: true,
        requiresApproval: true,
        organizerId: true,
        startDate: true,
        endDate: true,
        description: true,
        startLocation: true,
        destination: true,
        _count: { select: { participants: { where: { status: "CONFIRMED" } } } },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!["PUBLISHED", "OPEN", "ACTIVE"].includes(event.status)) {
      return NextResponse.json({ error: "Event is not accepting registrations" }, { status: 400 })
    }

    if (event.organizerId === session.user.id) {
      return NextResponse.json({ error: "You are the organizer of this event" }, { status: 400 })
    }

    // Check for existing registration
    const existing = await db.eventParticipant.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId } },
    })

    if (existing && existing.status !== "CANCELLED") {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 409 })
    }

    // Determine status
    let status: "PENDING" | "CONFIRMED" | "WAITLISTED" = "CONFIRMED"
    if (event.requiresApproval) {
      status = "PENDING"
    } else if (event.capacity && event._count.participants >= event.capacity) {
      status = "WAITLISTED"
    }

    const participant = existing
      ? await db.eventParticipant.update({
          where: { id: existing.id },
          data: { status, joinedAt: new Date() },
        })
      : await db.eventParticipant.create({
          data: { userId: session.user.id, eventId, status },
        })

    await track("event_registered", {
      userId: session.user.id,
      eventId,
      organizerId: event.organizerId,
      props: { status },
    })

    // Notify the organizer that someone joined (FR-2.18).
    await db.notification.create({
      data: {
        type: "SYSTEM",
        title: status === "PENDING" ? "New join request" : "New registration",
        content: `${session.user.name || "Someone"} ${
          status === "PENDING" ? "requested to join" : "registered for"
        } "${event.title}"`,
        link: `/events/${event.slug}/manage`,
        userId: event.organizerId,
        senderId: session.user.id,
      },
    })

    // RSVP confirmation email to the participant (FR-2.19), with a calendar
    // invite attached when they're confirmed. No-ops if email isn't configured.
    if (session.user.email) {
      const eventUrl = `${appUrl()}/events/${event.slug}`
      const { subject, html, text } = rsvpConfirmationEmail({
        eventTitle: event.title,
        eventUrl,
        whenText: whenText(event.startDate),
        status,
      })
      const attachments =
        status === "CONFIRMED"
          ? [
              {
                filename: "event.ics",
                content: buildIcs({
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  start: event.startDate,
                  end: event.endDate,
                  location: addressOf(event.destination) ?? addressOf(event.startLocation),
                  url: eventUrl,
                }),
                contentType: "text/calendar",
              },
            ]
          : undefined
      await sendEmail({ to: session.user.email, subject, html, text, attachments })
    }

    return NextResponse.json({ participant, status }, { status: 201 })
  } catch (error) {
    console.error("Event registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    const existing = await db.eventParticipant.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId } },
    })

    if (!existing || existing.status === "CANCELLED") {
      return NextResponse.json({ error: "Not registered for this event" }, { status: 404 })
    }

    const wasConfirmed = existing.status === "CONFIRMED"

    await db.eventParticipant.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
    })

    // Leaving a confirmed spot frees room — auto-promote the longest-waiting
    // person off the waitlist (FR-2.16 / FR-2.20).
    if (wasConfirmed) {
      const next = await db.eventParticipant.findFirst({
        where: { eventId, status: "WAITLISTED" },
        orderBy: { joinedAt: "asc" },
        include: {
          user: { select: { id: true, email: true } },
          event: { select: { title: true, slug: true, startDate: true } },
        },
      })
      if (next) {
        await db.eventParticipant.update({
          where: { id: next.id },
          data: { status: "CONFIRMED" },
        })
        await db.notification.create({
          data: {
            type: "RSVP_CONFIRMATION",
            title: "You're off the waitlist!",
            content: `A spot opened up — you're now confirmed for "${next.event.title}"`,
            link: `/events/${next.event.slug}`,
            userId: next.user.id,
          },
        })
        if (next.user.email) {
          const eventUrl = `${appUrl()}/events/${next.event.slug}`
          const { subject, html, text } = rsvpConfirmationEmail({
            eventTitle: next.event.title,
            eventUrl,
            whenText: whenText(next.event.startDate),
            status: "CONFIRMED",
          })
          await sendEmail({ to: next.user.email, subject, html, text })
        }
      }
    }

    return NextResponse.json({ message: "Registration cancelled" })
  } catch (error) {
    console.error("Event unregister error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
