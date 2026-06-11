import { describe, it, expect, vi, beforeEach } from "vitest"
import { PATCH as USER_PATCH } from "@/app/api/admin/users/[userId]/route"
import { PATCH as EVENT_PATCH, DELETE as EVENT_DELETE } from "@/app/api/admin/events/[eventId]/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)
const userParams = (userId = "u-2") => ({ params: Promise.resolve({ userId }) })
const eventParams = (eventId = "e-1") => ({ params: Promise.resolve({ eventId }) })
const patch = (body: unknown) => new Request("http://localhost", { method: "PATCH", body: JSON.stringify(body) })

describe("admin user moderation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("lets an admin ban a normal user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ role: "USER" } as never)
    mockDb.user.update.mockResolvedValue({} as never)

    const res = await USER_PATCH(patch({ banned: true }), userParams())
    expect(res.status).toBe(200)
    expect(mockDb.user.update).toHaveBeenCalled()
  })

  it("forbids non-admins entirely", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-9", role: "USER" } } as never)
    const res = await USER_PATCH(patch({ banned: true }), userParams())
    expect(res.status).toBe(403)
  })

  it("won't let you moderate your own account", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as never)
    const res = await USER_PATCH(patch({ banned: true }), userParams("admin-1"))
    expect(res.status).toBe(400)
  })

  it("stops a plain admin from touching another admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ role: "ADMIN" } as never)
    const res = await USER_PATCH(patch({ banned: true }), userParams())
    expect(res.status).toBe(403)
  })

  it("stops a plain admin from granting admin roles", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ role: "USER" } as never)
    const res = await USER_PATCH(patch({ role: "SUPER_ADMIN" }), userParams())
    expect(res.status).toBe(403)
  })

  it("lets a super admin grant admin roles", async () => {
    mockAuth.mockResolvedValue({ user: { id: "su-1", role: "SUPER_ADMIN" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ role: "USER" } as never)
    mockDb.user.update.mockResolvedValue({} as never)
    const res = await USER_PATCH(patch({ role: "ADMIN" }), userParams())
    expect(res.status).toBe(200)
  })
})

describe("admin event moderation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("features an event", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as never)
    mockDb.event.update.mockResolvedValue({} as never)
    const res = await EVENT_PATCH(patch({ featured: true }), eventParams())
    expect(res.status).toBe(200)
  })

  it("archives instead of hard-deleting", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as never)
    mockDb.event.update.mockResolvedValue({} as never)
    const res = await EVENT_DELETE(new Request("http://localhost", { method: "DELETE" }), eventParams())
    expect(res.status).toBe(200)
    expect(mockDb.event.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "ARCHIVED" } })
    )
  })

  it("forbids non-admins", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-9", role: "USER" } } as never)
    const res = await EVENT_PATCH(patch({ featured: true }), eventParams())
    expect(res.status).toBe(403)
  })
})
