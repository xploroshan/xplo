import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { verifyPassPayload, passCodeFor } from "@/lib/pass"
import { track } from "@/lib/analytics"

const body = z
  .object({
    // Either a scanned QR payload / typed short code...
    code: z.string().min(1).optional(),
    // ...or a direct tap-to-check-in from the roster.
    participantId: z.string().min(1).optional(),
    // Set false to undo an accidental check-in.
    checkedIn: z.boolean().default(true),
  })
  .refine((d) => d.code || d.participantId, { message: "code or participantId required" })

// Organizer-only: mark a rider as arrived at the assembly point.
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
    select: { id: true, organizerId: true },
  })
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
  if (event.organizerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }
  const { code, participantId, checkedIn } = parsed.data

  // Resolve the participant from whichever identifier we were given.
  let targetId: string | null = participantId ?? null
  if (!targetId && code) {
    const fromQr = verifyPassPayload(code)
    if (fromQr) {
      if (fromQr.eventId !== eventId) {
        return NextResponse.json({ error: "That pass is for a different event" }, { status: 400 })
      }
      targetId = fromQr.participantId
    } else {
      // Bare short code — compare against this event's confirmed riders.
      const candidates = await db.eventParticipant.findMany({
        where: { eventId, status: "CONFIRMED" },
        select: { id: true },
      })
      const normalized = code.trim().toUpperCase()
      targetId = candidates.find((c) => passCodeFor(c.id) === normalized)?.id ?? null
    }
  }
  if (!targetId) {
    return NextResponse.json({ error: "Pass not recognized" }, { status: 404 })
  }

  const participant = await db.eventParticipant.findFirst({
    where: { id: targetId, eventId },
    select: {
      id: true,
      status: true,
      checkedInAt: true,
      user: { select: { name: true, image: true } },
    },
  })
  if (!participant) {
    return NextResponse.json({ error: "Pass not recognized" }, { status: 404 })
  }
  if (participant.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Rider is not confirmed for this event", participant },
      { status: 409 }
    )
  }

  const alreadyCheckedIn = !!participant.checkedInAt
  const updated = await db.eventParticipant.update({
    where: { id: participant.id },
    data: { checkedInAt: checkedIn ? (participant.checkedInAt ?? new Date()) : null },
    select: { id: true, checkedInAt: true, user: { select: { name: true, image: true } } },
  })

  if (checkedIn && !alreadyCheckedIn) {
    await track("participant_checked_in", {
      userId: session.user.id,
      eventId,
      organizerId: event.organizerId,
    })
  }

  return NextResponse.json({ participant: updated, alreadyCheckedIn })
}
