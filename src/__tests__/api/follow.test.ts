import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST, DELETE } from "@/app/api/follow/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("Follow API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POST /api/follow", () => {
    it("follows an organizer successfully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", name: "Test" } } as never)
      mockDb.user.findUnique.mockResolvedValue({ role: "ORGANIZER", name: "Org" } as never)
      mockDb.follow.findUnique.mockResolvedValue(null)
      mockDb.follow.create.mockResolvedValue({ id: "f-1" } as never)
      mockDb.notification.create.mockResolvedValue({} as never)

      const request = new Request("http://localhost/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "org-1" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
      expect(mockDb.notification.create).toHaveBeenCalled()
    })

    it("prevents self-follow", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", name: "Test" } } as never)

      const request = new Request("http://localhost/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "user-1" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it("prevents duplicate follow", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", name: "Test" } } as never)
      mockDb.user.findUnique.mockResolvedValue({ role: "ORGANIZER", name: "Org" } as never)
      mockDb.follow.findUnique.mockResolvedValue({ id: "existing" } as never)

      const request = new Request("http://localhost/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "org-1" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(409)
    })

    it("returns 404 for non-organizer target", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", name: "Test" } } as never)
      mockDb.user.findUnique.mockResolvedValue({ role: "USER", name: "User" } as never)

      const request = new Request("http://localhost/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "user-2" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(404)
    })

    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as never)

      const request = new Request("http://localhost/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "org-1" }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })
  })

  describe("DELETE /api/follow", () => {
    it("unfollows successfully", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.follow.findUnique.mockResolvedValue({ id: "f-1" } as never)
      mockDb.follow.delete.mockResolvedValue({} as never)

      const request = new Request("http://localhost/api/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "org-1" }),
      })

      const response = await DELETE(request)
      expect(response.status).toBe(200)
    })

    it("returns 404 when not following", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.follow.findUnique.mockResolvedValue(null)

      const request = new Request("http://localhost/api/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "org-1" }),
      })

      const response = await DELETE(request)
      expect(response.status).toBe(404)
    })

    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as never)

      const request = new Request("http://localhost/api/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId: "org-1" }),
      })

      const response = await DELETE(request)
      expect(response.status).toBe(401)
    })
  })
})
