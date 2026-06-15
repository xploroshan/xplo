import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/events/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

function req(body: unknown) {
  return new Request("http://localhost/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const base = {
  title: "Weekend Ride to Goa",
  eventTypeSlug: "motorcycle-rides",
  startDate: "2026-07-01T06:00",
}

describe("Create event API — difficulty & AI assessment", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.eventType.findUnique.mockResolvedValue({ id: "et-1" } as never)
    // Existing slug + organizer role → no slug/role mutation path.
    mockDb.user.findUnique.mockResolvedValue({ slug: "rider", role: "ORGANIZER", name: "Rider" } as never)
    mockDb.event.create.mockResolvedValue({ id: "e-1", slug: "weekend-ride-to-goa" } as never)
    mockDb.follow.findMany.mockResolvedValue([] as never)
  })

  it("persists difficulty and aiAssessment when provided", async () => {
    const aiAssessment = {
      itinerary: [{ time: "06:00 AM", activity: "Assemble" }],
      safetyGuidelines: ["Wear a helmet"],
      weatherAdvisory: "Clear skies",
    }
    const res = await POST(req({ ...base, difficulty: "advanced", aiAssessment }))
    expect(res.status).toBe(201)
    expect(mockDb.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ difficulty: "advanced", aiAssessment }),
      })
    )
  })

  it("rejects an invalid difficulty value", async () => {
    const res = await POST(req({ ...base, difficulty: "impossible" }))
    expect(res.status).toBe(400)
    expect(mockDb.event.create).not.toHaveBeenCalled()
  })

  it("stores lat/lng in the location JSON when the map picker provides them", async () => {
    const res = await POST(
      req({
        ...base,
        startLocationAddress: "MG Road, Bangalore",
        startLocationLat: 12.97,
        startLocationLng: 77.6,
        destinationAddress: "Goa",
        destinationLat: 15.3,
        destinationLng: 74.1,
      })
    )
    expect(res.status).toBe(201)
    expect(mockDb.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startLocation: { address: "MG Road, Bangalore", lat: 12.97, lng: 77.6 },
          destination: { address: "Goa", lat: 15.3, lng: 74.1 },
        }),
      })
    )
  })

  it("creates without difficulty/aiAssessment (both optional)", async () => {
    const res = await POST(req(base))
    expect(res.status).toBe(201)
    expect(mockDb.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ difficulty: undefined, aiAssessment: undefined }),
      })
    )
  })
})
