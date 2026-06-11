import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { getEventChatAccess } from "@/lib/chat"
import { publishChange, eventChatChannel } from "@/lib/realtime"

const body = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  note: z.string().max(280).optional(),
})

// SOS (FR-4.12): alert the organizer + the whole group chat, with location.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params
  const access = await getEventChatAccess(eventId, session.user.id, session.user.role)
  if (!access) {
    return NextResponse.json({ error: "No access" }, { status: 403 })
  }

  const { success } = await rateLimit(`sos:${session.user.id}`, 3, 5 * 60_000)
  if (!success) {
    return NextResponse.json({ error: "SOS already sent — help is being notified" }, { status: 429 })
  }

  const parsed = body.safeParse(await request.json().catch(() => ({})))
  const d = parsed.success ? parsed.data : {}
  const name = session.user.name || "A rider"
  const mapsLink =
    d.lat !== undefined && d.lng !== undefined
      ? `https://www.google.com/maps?q=${d.lat},${d.lng}`
      : null

  const text = `🆘 SOS from ${name}${d.note ? ` — ${d.note}` : ""}${mapsLink ? `\nLocation: ${mapsLink}` : ""}`

  // System message in the group chat (visible to everyone on the ride).
  await db.message.create({
    data: { content: text, type: "SYSTEM", eventId, senderId: session.user.id },
  })
  await publishChange(eventChatChannel(eventId), "new")

  // Direct notification to the organizer.
  await db.notification.create({
    data: {
      type: "SYSTEM",
      title: `🆘 SOS — ${access.event.title}`,
      content: `${name} needs help${mapsLink ? ` — ${mapsLink}` : ""}`,
      link: `/events/${access.event.slug}/live`,
      userId: access.event.organizerId,
      senderId: session.user.id,
    },
  })

  return NextResponse.json({ sent: true }, { status: 201 })
}
