import { describe, it, expect, vi, beforeEach } from "vitest"
import { PATCH } from "@/app/api/admin/users/[userId]/verify/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("PATCH /api/admin/users/[userId]/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("toggles user verification when called by admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } } as never)
    mockDb.user.findUnique
      .mockResolvedValueOnce({ role: "ADMIN" } as never) // admin check
      .mockResolvedValueOnce({ verified: false } as never) // target user
    mockDb.user.update.mockResolvedValue({
      id: "user-1",
      verified: true,
    } as never)

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/user-1/verify", { method: "PATCH" }),
      { params: Promise.resolve({ userId: "user-1" }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.verified).toBe(true)
  })

  it("works for SUPER_ADMIN role too", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } } as never)
    mockDb.user.findUnique
      .mockResolvedValueOnce({ role: "SUPER_ADMIN" } as never)
      .mockResolvedValueOnce({ verified: true } as never)
    mockDb.user.update.mockResolvedValue({
      id: "user-1",
      verified: false,
    } as never)

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/user-1/verify", { method: "PATCH" }),
      { params: Promise.resolve({ userId: "user-1" }) }
    )

    expect(response.status).toBe(200)
  })

  it("returns 403 for non-admin user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ role: "USER" } as never)

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/user-2/verify", { method: "PATCH" }),
      { params: Promise.resolve({ userId: "user-2" }) }
    )

    expect(response.status).toBe(403)
  })

  it("returns 403 for organizer (non-admin) role", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ role: "ORGANIZER" } as never)

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/user-2/verify", { method: "PATCH" }),
      { params: Promise.resolve({ userId: "user-2" }) }
    )

    expect(response.status).toBe(403)
  })

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never)

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/user-1/verify", { method: "PATCH" }),
      { params: Promise.resolve({ userId: "user-1" }) }
    )

    expect(response.status).toBe(401)
  })

  it("returns 404 when target user not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } } as never)
    mockDb.user.findUnique
      .mockResolvedValueOnce({ role: "ADMIN" } as never) // admin check
      .mockResolvedValueOnce(null) // user not found

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/nonexistent/verify", { method: "PATCH" }),
      { params: Promise.resolve({ userId: "nonexistent" }) }
    )

    expect(response.status).toBe(404)
  })
})
