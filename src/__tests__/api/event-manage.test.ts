import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, PATCH } from "@/app/api/events/[eventId]/participants/route"
import { DELETE } from "@/app/api/events/[eventId]/register/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

function params(eventId = "event-1") {
  return { params: Promise.resolve({ eventId }) }
}

describe("Participant management API", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("GET roster", () => {
    it("returns the roster to the organizer", async () => {
      mockAuth.mockResolvedValue({ user: { id: "org-1", role: "ORGANIZER" } } as never)
      mockDb.event.findUnique.mockResolvedValue({
        id: "event-1", title: "Ride", slug: "ride", organizerId: "org-1", startDate: new Date(),
      } as never)
      mockDb.eventParticipant.findMany.mockResolvedValue([{ id: "p-1" }] as never)

      const res = await GET(new Request("http://localhost"), params())
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.participants).toHaveLength(1)
    })

    it("forbids non-organizers", async () => {
      mockAuth.mockResolvedValue({ user: { id: "rando", role: "USER" } } as never)
      mockDb.event.findUnique.mockResolvedValue({
        id: "event-1", title: "Ride", slug: "ride", organizerId: "org-1", startDate: new Date(),
      } as never)

      const res = await GET(new Request("http://localhost"), params())
      expect(res.status).toBe(403)
    })
  })

  describe("PATCH participant", () => {
    it("approves a pending participant and notifies them", async () => {
      mockAuth.mockResolvedValue({ user: { id: "org-1", role: "ORGANIZER" } } as never)
      mockDb.event.findUnique.mockResolvedValue({
        id: "event-1", title: "Ride", slug: "ride", organizerId: "org-1", startDate: new Date(),
      } as never)
      mockDb.eventParticipant.findFirst.mockResolvedValue({
        id: "p-1", status: "PENDING", user: { id: "u-2", email: null, name: "Sam" },
      } as never)
      mockDb.eventParticipant.update.mockResolvedValue({ id: "p-1", status: "CONFIRMED", role: "MEMBER" } as never)

      const res = await PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ participantId: "p-1", status: "CONFIRMED" }),
        }),
        params()
      )
      expect(res.status).toBe(200)
      expect(mockDb.notification.create).toHaveBeenCalled()
    })

    it("rejects an invalid status", async () => {
      mockAuth.mockResolvedValue({ user: { id: "org-1", role: "ORGANIZER" } } as never)
      mockDb.event.findUnique.mockResolvedValue({
        id: "event-1", title: "Ride", slug: "ride", organizerId: "org-1", startDate: new Date(),
      } as never)

      const res = await PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ participantId: "p-1", status: "BOGUS" }),
        }),
        params()
      )
      expect(res.status).toBe(400)
    })
  })

  describe("waitlist auto-promote on leave", () => {
    it("promotes the next waitlisted rider when a confirmed one leaves", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.eventParticipant.findUnique.mockResolvedValue({ id: "p-1", status: "CONFIRMED" } as never)
      mockDb.eventParticipant.update.mockResolvedValue({} as never)
      mockDb.eventParticipant.findFirst.mockResolvedValue({
        id: "p-2",
        user: { id: "u-2", email: null },
        event: { title: "Ride", slug: "ride", startDate: new Date() },
      } as never)

      const res = await DELETE(
        new Request("http://localhost", { method: "DELETE" }),
        params()
      )
      expect(res.status).toBe(200)
      // p-1 cancelled + p-2 promoted = two updates
      expect(mockDb.eventParticipant.update).toHaveBeenCalledTimes(2)
      expect(mockDb.notification.create).toHaveBeenCalled()
    })
  })
})
