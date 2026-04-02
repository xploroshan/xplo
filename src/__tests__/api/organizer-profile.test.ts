import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/organizers/[slug]/route"
import { GET as GETEvents } from "@/app/api/organizers/[slug]/events/route"
import { db } from "@/lib/db"

const mockDb = vi.mocked(db)

describe("GET /api/organizers/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockOrganizer = {
    id: "org-1",
    name: "Test Organizer",
    image: null,
    bio: "I organize rides",
    city: "Mumbai",
    slug: "test-organizer",
    verified: true,
    socialLinks: null,
    createdAt: new Date(),
    role: "ORGANIZER",
    _count: { organizedEvents: 5, followers: 100 },
  }

  it("returns organizer profile with stats", async () => {
    mockDb.user.findUnique.mockResolvedValue(mockOrganizer as never)
    mockDb.eventParticipant.aggregate
      .mockResolvedValueOnce({ _count: 250 } as never) // participants
      .mockResolvedValueOnce({ _avg: { rating: 4.5 }, _count: { rating: 30 } } as never) // ratings

    const response = await GET(
      new Request("http://localhost/api/organizers/test-organizer"),
      { params: Promise.resolve({ slug: "test-organizer" }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe("Test Organizer")
    expect(data.stats.eventsCount).toBe(5)
    expect(data.stats.followersCount).toBe(100)
    expect(data.stats.totalParticipants).toBe(250)
    expect(data.stats.avgRating).toBe(4.5)
  })

  it("returns 404 for unknown slug", async () => {
    mockDb.user.findUnique.mockResolvedValue(null)

    const response = await GET(
      new Request("http://localhost/api/organizers/unknown"),
      { params: Promise.resolve({ slug: "unknown" }) }
    )

    expect(response.status).toBe(404)
  })

  it("returns 404 for non-organizer user", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      ...mockOrganizer,
      role: "USER",
    } as never)

    const response = await GET(
      new Request("http://localhost/api/organizers/regular-user"),
      { params: Promise.resolve({ slug: "regular-user" }) }
    )

    expect(response.status).toBe(404)
  })
})

describe("GET /api/organizers/[slug]/events", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns paginated upcoming events by default", async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: "org-1", role: "ORGANIZER" } as never)
    mockDb.event.findMany.mockResolvedValue([
      { id: "e1", title: "Ride 1", _count: { participants: 10 } },
    ] as never)
    mockDb.event.count.mockResolvedValue(1)

    const response = await GETEvents(
      new Request("http://localhost/api/organizers/test/events"),
      { params: Promise.resolve({ slug: "test" }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.events).toHaveLength(1)
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(12)
  })

  it("returns 404 for unknown organizer", async () => {
    mockDb.user.findUnique.mockResolvedValue(null)

    const response = await GETEvents(
      new Request("http://localhost/api/organizers/unknown/events"),
      { params: Promise.resolve({ slug: "unknown" }) }
    )

    expect(response.status).toBe(404)
  })

  it("supports pagination via query params", async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: "org-1", role: "ORGANIZER" } as never)
    mockDb.event.findMany.mockResolvedValue([] as never)
    mockDb.event.count.mockResolvedValue(25)

    const response = await GETEvents(
      new Request("http://localhost/api/organizers/test/events?page=3&tab=past"),
      { params: Promise.resolve({ slug: "test" }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pagination.page).toBe(3)
  })
})
