import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as TRACK, GET as STATE } from "@/app/api/events/[eventId]/track/route"
import { POST as SOS } from "@/app/api/events/[eventId]/sos/route"
import { haversineKm, summarizeTrail } from "@/lib/geo"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)
const p = (eventId = "event-1") => ({ params: Promise.resolve({ eventId }) })
const req = (body: unknown) =>
  new Request("http://localhost", { method: "POST", body: JSON.stringify(body) })

const activeEvent = {
  id: "event-1", slug: "ride", title: "Ride", status: "ACTIVE",
  chatActive: true, organizerId: "org-1", assemblyPoint: null,
}

describe("geo math", () => {
  it("computes plausible distances", () => {
    // Bangalore → Mysore is ~125-145 km straight line
    const km = haversineKm({ lat: 12.9716, lng: 77.5946 }, { lat: 12.2958, lng: 76.6394 })
    expect(km).toBeGreaterThan(120)
    expect(km).toBeLessThan(150)
  })

  it("summarizes a trail and skips GPS glitches", () => {
    const t0 = Date.now()
    const pts = [
      { lat: 12.97, lng: 77.59, recordedAt: new Date(t0) },
      { lat: 12.98, lng: 77.6, recordedAt: new Date(t0 + 5 * 60_000) },
      // glitch: jumps ~110km in 5 min — must be ignored
      { lat: 13.9, lng: 77.6, recordedAt: new Date(t0 + 10 * 60_000) },
      { lat: 12.99, lng: 77.61, recordedAt: new Date(t0 + 15 * 60_000) },
    ]
    const s = summarizeTrail(pts)
    expect(s).not.toBeNull()
    expect(s!.distanceKm).toBeLessThan(10) // glitch leg excluded
    expect(s!.durationMin).toBe(15)
  })

  it("returns null for trivial trails", () => {
    expect(summarizeTrail([])).toBeNull()
    expect(summarizeTrail([{ lat: 1, lng: 1, recordedAt: new Date() }])).toBeNull()
  })
})

describe("POST /track", () => {
  beforeEach(() => vi.clearAllMocks())

  it("accepts a ping from a confirmed rider on an active ride", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER", name: "Sam" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "PILOT" } as never)
    mockDb.locationPing.create.mockResolvedValue({ recordedAt: new Date() } as never)

    const res = await TRACK(req({ lat: 12.97, lng: 77.59, speedKmh: 42 }), p())
    expect(res.status).toBe(201)
    expect(mockDb.locationPing.create).toHaveBeenCalled()
  })

  it("rejects pings when the ride isn't active", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue({ ...activeEvent, status: "OPEN" } as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)

    const res = await TRACK(req({ lat: 12.97, lng: 77.59 }), p())
    expect(res.status).toBe(409)
  })

  it("rejects non-participants", async () => {
    mockAuth.mockResolvedValue({ user: { id: "rando", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue(null)

    const res = await TRACK(req({ lat: 12.97, lng: 77.59 }), p())
    expect(res.status).toBe(403)
  })

  it("rejects garbage coordinates", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)

    const res = await TRACK(req({ lat: 999, lng: 77.59 }), p())
    expect(res.status).toBe(400)
  })
})

describe("GET /track", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns riders + trails to a member", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    mockDb.locationPing.findMany.mockResolvedValue([
      { userId: "u-3", lat: 12.9, lng: 77.5, speedKmh: 40, recordedAt: new Date(), user: { name: "Lee", image: null } },
    ] as never)
    mockDb.eventParticipant.findMany.mockResolvedValue([{ userId: "u-3", role: "PILOT" }] as never)

    const res = await STATE(new Request("http://localhost"), p())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.riders[0].role).toBe("PILOT")
  })
})

describe("POST /sos", () => {
  beforeEach(() => vi.clearAllMocks())

  it("posts a SYSTEM chat message and notifies the organizer", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER", name: "Sam" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    mockDb.message.create.mockResolvedValue({} as never)
    mockDb.notification.create.mockResolvedValue({} as never)

    const res = await SOS(req({ lat: 12.9, lng: 77.5 }), p())
    expect(res.status).toBe(201)
    expect(mockDb.message.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "SYSTEM" }) })
    )
    expect(mockDb.notification.create).toHaveBeenCalled()
  })
})
