import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as REMIND, DELETE as UNREMIND } from "@/app/api/events/[eventId]/remind/route"
import { PATCH } from "@/app/api/events/[eventId]/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

function params(eventId = "event-1") {
  return { params: Promise.resolve({ eventId }) }
}

describe("Remind me API", () => {
  beforeEach(() => vi.clearAllMocks())

  it("adds a reminder", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.event.findUnique.mockResolvedValue({ id: "event-1" } as never)
    mockDb.eventReminder.upsert.mockResolvedValue({} as never)

    const res = await REMIND(new Request("http://localhost", { method: "POST" }), params())
    expect(res.status).toBe(201)
    expect(mockDb.eventReminder.upsert).toHaveBeenCalled()
  })

  it("removes a reminder", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.eventReminder.delete.mockResolvedValue({} as never)

    const res = await UNREMIND(new Request("http://localhost", { method: "DELETE" }), params())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.reminding).toBe(false)
  })

  it("requires auth", async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await REMIND(new Request("http://localhost", { method: "POST" }), params())
    expect(res.status).toBe(401)
  })
})

describe("Notify-on-open via event PATCH", () => {
  beforeEach(() => vi.clearAllMocks())

  it("notifies reminder holders and clears them when status flips to OPEN", async () => {
    mockAuth.mockResolvedValue({ user: { id: "org-1", role: "ORGANIZER" } } as never)
    mockDb.event.findUnique.mockResolvedValue({
      id: "event-1", slug: "ride", title: "Ride", organizerId: "org-1",
      startDate: new Date(), status: "CLOSED",
    } as never)
    mockDb.event.update.mockResolvedValue({ id: "event-1", slug: "ride" } as never)
    mockDb.eventReminder.findMany.mockResolvedValue([{ userId: "u-2" }, { userId: "u-3" }] as never)
    mockDb.eventReminder.deleteMany.mockResolvedValue({ count: 2 } as never)

    const res = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ status: "OPEN" }),
      }),
      params()
    )
    expect(res.status).toBe(200)
    expect(mockDb.notification.createMany).toHaveBeenCalled()
    expect(mockDb.eventReminder.deleteMany).toHaveBeenCalled()
  })
})
