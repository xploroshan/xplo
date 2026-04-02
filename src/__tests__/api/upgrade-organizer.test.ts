import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/users/upgrade-to-organizer/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("POST /api/users/upgrade-to-organizer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("upgrades user to organizer with custom slug", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
    mockDb.user.findUnique
      .mockResolvedValueOnce({ role: "USER", name: "Test", slug: null } as never) // user check
      .mockResolvedValueOnce(null as never) // slug uniqueness
    mockDb.user.update.mockResolvedValue({
      slug: "my-events",
      role: "ORGANIZER",
    } as never)

    const request = new Request("http://localhost/api/users/upgrade-to-organizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "my-events" }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.slug).toBe("my-events")
    expect(data.role).toBe("ORGANIZER")
  })

  it("auto-generates slug when none provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
    mockDb.user.findUnique
      .mockResolvedValueOnce({ role: "USER", name: "Test User", slug: null } as never)
      .mockResolvedValueOnce(null as never) // slug check
    mockDb.user.update.mockResolvedValue({
      slug: "test-user",
      role: "ORGANIZER",
    } as never)

    const request = new Request("http://localhost/api/users/upgrade-to-organizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it("returns 400 if already an organizer", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({
      role: "ORGANIZER",
      name: "Org",
      slug: "org",
    } as never)

    const request = new Request("http://localhost/api/users/upgrade-to-organizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 409 when slug is taken", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
    mockDb.user.findUnique
      .mockResolvedValueOnce({ role: "USER", name: "Test", slug: null } as never)
      .mockResolvedValueOnce({ id: "other" } as never) // slug taken

    const request = new Request("http://localhost/api/users/upgrade-to-organizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "taken-slug" }),
    })

    const response = await POST(request)
    expect(response.status).toBe(409)
  })

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never)

    const request = new Request("http://localhost/api/users/upgrade-to-organizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
