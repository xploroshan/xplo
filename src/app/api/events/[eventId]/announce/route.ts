import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sendEmail, eventAnnouncementEmail, appUrl } from "@/lib/email"
import { sanitizeInput } from "@/lib/sanitize"

const body = z.object({
  message: z.string().min(1, "Message is required").max(2000),
})

// Broadcast an announcement to everyone confirmed for the event — in-app
// notification + email. Organizer (or admin) only.
export async function POST(
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
    select: { id: true, slug: true, title: true, organizerId: true },
  })
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
  if (event.organizerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Limit broadcasts so the channel can't be abused.
  const { success } = await rateLimit(`announce:${session.user.id}`, 10, 60 * 60 * 1000)
  if (!success) {
    return NextResponse.json({ error: "Too many announcements. Try again later." }, { status: 429 })
  }

  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }
  const message = sanitizeInput(parsed.data.message)

  const recipients = await db.eventParticipant.findMany({
    where: { eventId: event.id, status: "CONFIRMED" },
    select: { user: { select: { id: true, email: true } } },
  })

  if (recipients.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  await db.notification.createMany({
    data: recipients.map((r) => ({
      type: "EVENT_UPDATE" as const,
      title: `Update: ${event.title}`,
      content: message,
      link: `/events/${event.slug}`,
      userId: r.user.id,
      senderId: session.user!.id,
    })),
  })

  // Email in parallel (best-effort; no-ops if email isn't configured).
  const eventUrl = `${appUrl()}/events/${event.slug}`
  const { subject, html, text } = eventAnnouncementEmail({
    eventTitle: event.title,
    eventUrl,
    message,
    organizerName: session.user.name || "The organizer",
  })
  await Promise.allSettled(
    recipients
      .filter((r) => r.user.email)
      .map((r) => sendEmail({ to: r.user.email as string, subject, html, text }))
  )

  return NextResponse.json({ sent: recipients.length })
}
