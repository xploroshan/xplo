import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/events/[eventId]/checkin/route"
import { buildPassPayload, passCodeFor, verifyPassPayload } from "@/lib/pass"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

function params(eventId = "event-1") {
  return { params: Promise.resolve({ eventId }) }
}

describe("Pass codes", () => {
  it("round-trips a QR payload", () => {
    const payload = buildPassPayload("event-1", "p-1")
    const parsed = verifyPassPayload(payload)
    expect(parsed).toEqual({ eventId: "event-1", participantId: "p-1" })
  })

  it("rejects a tampered payload", () => {
    const payload = buildPassPayload("event-1", "p-1")
    // Swap the participant id without re-signing
    const tampered = payload.replace("|p-1|", "|p-2|")
    expect(verifyPassPayload(tampered)).toBeNull()
  })

  it("derives a stable short code", () => {
    expect(passCodeFor("p-1")).toEqual(passCodeFor("p-1"))
    expect(passCodeFor("p-1")).not.toEqual(passCodeFor("p-2"))
    expect(passCodeFor("p-1")).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })
})

describe("Check-in API", () => {
  beforeEach(() => vi.clearAllMocks())

  const organizerSession = { user: { id: "org-1", role: "ORGANIZER" } }
  const mockEvent = { id: "event-1", organizerId: "org-1" }

  it("checks a rider in via QR payload", async () => {
    mockAuth.mockResolvedValue(organizerSession as never)
    mockDb.event.findUnique.mockResolvedValue(mockEvent as never)
    mockDb.eventParticipant.findFirst.mockResolvedValue({
      id: "p-1", status: "CONFIRMED", checkedInAt: null, user: { name: "Sam", image: null },
    } as never)
    mockDb.eventParticipant.update.mockResolvedValue({
      id: "p-1", checkedInAt: new Date(), user: { name: "Sam", image: null },
    } as never)

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ code: buildPassPayload("event-1", "p-1") }),
      }),
      params()
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.participant.checkedInAt).toBeTruthy()
  })

  it("rejects a pass from a different event", async () => {
    mockAuth.mockResolvedValue(organizerSession as never)
    mockDb.event.findUnique.mockResolvedValue(mockEvent as never)

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ code: buildPassPayload("other-event", "p-1") }),
      }),
      params()
    )
    expect(res.status).toBe(400)
  })

  it("forbids non-organizers", async () => {
    mockAuth.mockResolvedValue({ user: { id: "rando", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(mockEvent as never)

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ participantId: "p-1" }),
      }),
      params()
    )
    expect(res.status).toBe(403)
  })

  it("checks in via bare short code", async () => {
    mockAuth.mockResolvedValue(organizerSession as never)
    mockDb.event.findUnique.mockResolvedValue(mockEvent as never)
    mockDb.eventParticipant.findMany.mockResolvedValue([{ id: "p-7" }] as never)
    mockDb.eventParticipant.findFirst.mockResolvedValue({
      id: "p-7", status: "CONFIRMED", checkedInAt: null, user: { name: "Lee", image: null },
    } as never)
    mockDb.eventParticipant.update.mockResolvedValue({
      id: "p-7", checkedInAt: new Date(), user: { name: "Lee", image: null },
    } as never)

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ code: passCodeFor("p-7").toLowerCase() }),
      }),
      params()
    )
    expect(res.status).toBe(200)
  })
})
