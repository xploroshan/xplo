import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST, DELETE } from "@/app/api/events/[eventId]/register/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("Event Registration API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockEvent = {
    id: "event-1",
    status: "OPEN",
    capacity: 50,
    requiresApproval: false,
    organizerId: "org-1",
    _count: { participants: 10 },
  }

  describe("POST /api/events/[eventId]/register", () => {
    it("registers user for an event", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.event.findUnique.mockResolvedValue(mockEvent as never)
      mockDb.eventParticipant.findUnique.mockResolvedValue(null)
      mockDb.eventParticipant.create.mockResolvedValue({
        id: "p-1",
        status: "CONFIRMED",
      } as never)

      const response = await POST(
        new Request("http://localhost/api/events/event-1/register", { method: "POST" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.status).toBe("CONFIRMED")
    })

    it("waitlists when event is at capacity", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.event.findUnique.mockResolvedValue({
        ...mockEvent,
        capacity: 10,
        _count: { participants: 10 },
      } as never)
      mockDb.eventParticipant.findUnique.mockResolvedValue(null)
      mockDb.eventParticipant.create.mockResolvedValue({
        id: "p-1",
        status: "WAITLISTED",
      } as never)

      const response = await POST(
        new Request("http://localhost/api/events/event-1/register", { method: "POST" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.status).toBe("WAITLISTED")
    })

    it("sets status to PENDING when approval required", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.event.findUnique.mockResolvedValue({
        ...mockEvent,
        requiresApproval: true,
      } as never)
      mockDb.eventParticipant.findUnique.mockResolvedValue(null)
      mockDb.eventParticipant.create.mockResolvedValue({
        id: "p-1",
        status: "PENDING",
      } as never)

      const response = await POST(
        new Request("http://localhost/api/events/event-1/register", { method: "POST" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.status).toBe("PENDING")
    })

    it("prevents organizer from self-registering", async () => {
      mockAuth.mockResolvedValue({ user: { id: "org-1" } } as never)
      mockDb.event.findUnique.mockResolvedValue(mockEvent as never)

      const response = await POST(
        new Request("http://localhost/api/events/event-1/register", { method: "POST" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )

      expect(response.status).toBe(400)
    })

    it("prevents duplicate registration", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.event.findUnique.mockResolvedValue(mockEvent as never)
      mockDb.eventParticipant.findUnique.mockResolvedValue({
        id: "p-1",
        status: "CONFIRMED",
      } as never)

      const response = await POST(
        new Request("http://localhost/api/events/event-1/register", { method: "POST" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )

      expect(response.status).toBe(409)
    })

    it("re-registers cancelled participant", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.event.findUnique.mockResolvedValue(mockEvent as never)
      mockDb.eventParticipant.findUnique.mockResolvedValue({
        id: "p-1",
        status: "CANCELLED",
      } as never)
      mockDb.eventParticipant.update.mockResolvedValue({
        id: "p-1",
        status: "CONFIRMED",
      } as never)

      const response = await POST(
        new Request("http://localhost/api/events/event-1/register", { method: "POST" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )

      expect(response.status).toBe(201)
      expect(mockDb.eventParticipant.update).toHaveBeenCalled()
    })

    it("returns 404 for non-existent event", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.event.findUnique.mockResolvedValue(null)

      const response = await POST(
        new Request("http://localhost/api/events/bad-id/register", { method: "POST" }),
        { params: Promise.resolve({ eventId: "bad-id" }) }
      )

      expect(response.status).toBe(404)
    })

    it("rejects registration for closed events", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: "COMPLETED",
      } as never)

      const response = await POST(
        new Request("http://localhost/api/events/event-1/register", { method: "POST" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )

      expect(response.status).toBe(400)
    })

    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as never)

      const response = await POST(
        new Request("http://localhost/api/events/event-1/register", { method: "POST" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )

      expect(response.status).toBe(401)
    })
  })

  describe("DELETE /api/events/[eventId]/register", () => {
    it("cancels registration", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.eventParticipant.findUnique.mockResolvedValue({
        id: "p-1",
        status: "CONFIRMED",
      } as never)
      mockDb.eventParticipant.update.mockResolvedValue({} as never)

      const response = await DELETE(
        new Request("http://localhost/api/events/event-1/register", { method: "DELETE" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )

      expect(response.status).toBe(200)
    })

    it("returns 404 when not registered", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.eventParticipant.findUnique.mockResolvedValue(null)

      const response = await DELETE(
        new Request("http://localhost/api/events/event-1/register", { method: "DELETE" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )

      expect(response.status).toBe(404)
    })

    it("returns 404 for already cancelled registration", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.eventParticipant.findUnique.mockResolvedValue({
        id: "p-1",
        status: "CANCELLED",
      } as never)

      const response = await DELETE(
        new Request("http://localhost/api/events/event-1/register", { method: "DELETE" }),
        { params: Promise.resolve({ eventId: "event-1" }) }
      )

      expect(response.status).toBe(404)
    })
  })
})
