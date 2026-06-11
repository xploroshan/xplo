import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { publishLocation } from "@/lib/realtime"

// Resolve the caller's tracking role for this event: ORGANIZER, or the
// participant's role (PILOT / SWEEP / MODERATOR / MEMBER). Null = no access.
async function getTrackRole(eventId: string, userId: string, userRole?: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true, organizerId: true, assemblyPoint: true },
  })
  if (!event) return null
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
  if (event.organizerId === userId || isAdmin) return { event, role: "ORGANIZER" as string }
  const p = await db.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { status: true, role: true },
  })
  if (!p || p.status !== "CONFIRMED") return null
  return { event, role: p.role as string }
}

const postBody = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speedKmh: z.number().min(0).max(300).nullable().optional(),
})

// Share my live position (only while the ride is ACTIVE).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params
  const access = await getTrackRole(eventId, session.user.id, session.user.role)
  if (!access) {
    return NextResponse.json({ error: "No access" }, { status: 403 })
  }
  if (access.event.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tracking is only live during an active ride" }, { status: 409 })
  }

  // Max ~1 ping / 4s per rider.
  const { success } = await rateLimit(`track:${session.user.id}:${eventId}`, 15, 60_000)
  if (!success) {
    return NextResponse.json({ error: "Too many pings" }, { status: 429 })
  }

  const parsed = postBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
  }
  const { lat, lng, speedKmh } = parsed.data

  const ping = await db.locationPing.create({
    data: { eventId, userId: session.user.id, lat, lng, speedKmh: speedKmh ?? null },
    select: { recordedAt: true },
  })

  // Realtime fan-out (no-op without ABLY_API_KEY — watchers then poll GET).
  await publishLocation(eventId, {
    userId: session.user.id,
    name: session.user.name ?? null,
    role: access.role,
    lat,
    lng,
    speedKmh: speedKmh ?? null,
    at: ping.recordedAt.toISOString(),
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}

// Live state: latest position per rider + Pilot/Sweep trails (for route painting).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params
  const access = await getTrackRole(eventId, session.user.id, session.user.role)
  if (!access) {
    return NextResponse.json({ error: "No access" }, { status: 403 })
  }

  // Latest ping per rider (distinct on userId with desc ordering keeps the newest).
  const latest = await db.locationPing.findMany({
    where: { eventId },
    orderBy: { recordedAt: "desc" },
    distinct: ["userId"],
    take: 100,
    select: {
      userId: true,
      lat: true,
      lng: true,
      speedKmh: true,
      recordedAt: true,
      user: { select: { name: true, image: true } },
    },
  })

  // Roles for marker colors + trail selection.
  const parts = await db.eventParticipant.findMany({
    where: { eventId, userId: { in: latest.map((l) => l.userId) } },
    select: { userId: true, role: true },
  })
  const roleMap = new Map(parts.map((p) => [p.userId, p.role as string]))
  if (access.event.organizerId) roleMap.set(access.event.organizerId, "ORGANIZER")

  // Trails for pilot + sweep (last 600 samples each).
  const specialIds = [...roleMap.entries()]
    .filter(([, r]) => r === "PILOT" || r === "SWEEP")
    .map(([id]) => id)
  const trails: Record<string, { lat: number; lng: number }[]> = {}
  for (const id of specialIds.slice(0, 4)) {
    const pts = await db.locationPing.findMany({
      where: { eventId, userId: id },
      orderBy: { recordedAt: "asc" },
      take: 600,
      select: { lat: true, lng: true },
    })
    trails[id] = pts
  }

  return NextResponse.json({
    status: access.event.status,
    myRole: access.role,
    me: session.user.id,
    assemblyPoint: access.event.assemblyPoint,
    riders: latest.map((l) => ({
      userId: l.userId,
      name: l.user.name,
      role: roleMap.get(l.userId) ?? "MEMBER",
      lat: l.lat,
      lng: l.lng,
      speedKmh: l.speedKmh,
      at: l.recordedAt,
    })),
    trails,
  })
}
