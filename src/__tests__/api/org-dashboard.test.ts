import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/organizations/[slug]/dashboard/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

const params = (slug = "acme") => ({ params: Promise.resolve({ slug }) })
const req = () => new Request("http://localhost/api/organizations/acme/dashboard")

describe("Org dashboard endpoint", () => {
  beforeEach(() => vi.clearAllMocks())

  it("401s when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(req(), params())
    expect(res.status).toBe(401)
  })

  it("404s for an unknown org", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.organization.findUnique.mockResolvedValue(null)
    const res = await GET(req(), params())
    expect(res.status).toBe(404)
  })

  it("403s for a non-member", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.organization.findUnique.mockResolvedValue({
      id: "org-1", avgRating: null, ratingOverride: null, ratingLocked: false,
      members: [], _count: { events: 3, members: 2 },
    } as never)
    const res = await GET(req(), params())
    expect(res.status).toBe(403)
  })

  it("returns stats + recent events for a member", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.organization.findUnique.mockResolvedValue({
      id: "org-1", avgRating: 4.5, ratingOverride: null, ratingLocked: false,
      members: [{ id: "m-1" }], _count: { events: 7, members: 4 },
    } as never)
    mockDb.event.count.mockResolvedValue(2 as never)
    mockDb.organizationMember.count.mockResolvedValue(1 as never)
    mockDb.eventParticipant.aggregate.mockResolvedValue({ _count: 42 } as never)
    mockDb.event.findMany.mockResolvedValue([
      { id: "e-1", title: "Ride", slug: "ride", status: "OPEN", startDate: new Date(), _count: { participants: 5 } },
    ] as never)

    const res = await GET(req(), params())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.stats).toMatchObject({
      eventsThisMonth: 2,
      newMembers: 1,
      avgRating: 4.5,
      totalEvents: 7,
      totalMembers: 4,
      totalParticipants: 42,
    })
    expect(data.recentEvents).toHaveLength(1)
    expect(data.recentEvents[0]).toMatchObject({ slug: "ride", participantCount: 5 })
  })
})
