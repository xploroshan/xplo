import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/pins/route"
import { DELETE } from "@/app/api/pins/[organizerId]/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("Pins API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/pins", () => {
    it("returns user pins when authenticated", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.organizerPin.findMany.mockResolvedValue([
        { id: "pin-1", organizer: { id: "org-1", name: "Org 1", slug: "org-1" } },
      ] as never)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pins).toHaveLength(1)
    })

    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as never)

      const response = await GET()
      expect(response.status).toBe(401)
    })
  })

  describe("POST /api/pins", () => {
    it("creates a pin successfully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.user.findUnique.mockResolvedValue({ role: "ORGANIZER" } as never)
      mockDb.$transaction.mockImplementation(async (fn) => {
        return fn({
          organizerPin: {
            count: vi.fn().mockResolvedValue(2),
            create: vi.fn().mockResolvedValue({
              id: "pin-1",
              organizer: { id: "org-1", name: "Org", slug: "org" },
            }),
          },
        } as never)
      })

      const request = new Request("http://localhost/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "org-1" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as never)

      const request = new Request("http://localhost/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "org-1" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it("returns 404 for non-organizer user", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.user.findUnique.mockResolvedValue({ role: "USER" } as never)

      const request = new Request("http://localhost/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "user-2" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(404)
    })

    it("returns 409 when max pins (5) reached", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.user.findUnique.mockResolvedValue({ role: "ORGANIZER" } as never)
      mockDb.$transaction.mockImplementation(async (fn) => {
        return fn({
          organizerPin: {
            count: vi.fn().mockResolvedValue(5),
            create: vi.fn(),
          },
        } as never)
      })

      const request = new Request("http://localhost/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "org-1" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(409)
    })

    it("returns 400 for empty organizer ID", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)

      const request = new Request("http://localhost/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe("DELETE /api/pins/[organizerId]", () => {
    it("deletes a pin and reorders remaining", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.organizerPin.findUnique.mockResolvedValue({ id: "pin-1" } as never)
      mockDb.organizerPin.delete.mockResolvedValue({} as never)
      mockDb.organizerPin.findMany.mockResolvedValue([
        { id: "pin-2", position: 2 },
      ] as never)
      mockDb.organizerPin.update.mockResolvedValue({} as never)

      const response = await DELETE(
        new Request("http://localhost/api/pins/org-1", { method: "DELETE" }),
        { params: Promise.resolve({ organizerId: "org-1" }) }
      )

      expect(response.status).toBe(200)
    })

    it("returns 404 when pin not found", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.organizerPin.findUnique.mockResolvedValue(null)

      const response = await DELETE(
        new Request("http://localhost/api/pins/org-1", { method: "DELETE" }),
        { params: Promise.resolve({ organizerId: "org-1" }) }
      )

      expect(response.status).toBe(404)
    })

    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as never)

      const response = await DELETE(
        new Request("http://localhost/api/pins/org-1", { method: "DELETE" }),
        { params: Promise.resolve({ organizerId: "org-1" }) }
      )

      expect(response.status).toBe(401)
    })
  })
})
