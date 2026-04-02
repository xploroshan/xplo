import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/auth/change-password/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("POST /api/auth/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("changes password successfully", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({
      passwordHash: "$2a$12$hashedpassword",
    } as never)

    const bcrypt = await import("bcryptjs")
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never)

    mockDb.user.update.mockResolvedValue({} as never)

    const request = new Request("http://localhost/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPass1!",
        newPassword: "NewPass1!",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Password changed successfully")
  })

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never)

    const request = new Request("http://localhost/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPass1!",
        newPassword: "NewPass1!",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("returns 400 for OAuth-only account (no passwordHash)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ passwordHash: null } as never)

    const request = new Request("http://localhost/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPass1!",
        newPassword: "NewPass1!",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain("OAuth")
  })

  it("returns 400 when current password is wrong", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({
      passwordHash: "$2a$12$hashedpassword",
    } as never)

    const bcrypt = await import("bcryptjs")
    vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never)

    const request = new Request("http://localhost/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "WrongPass1!",
        newPassword: "NewPass1!",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 when new password is weak", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)

    const request = new Request("http://localhost/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPass1!",
        newPassword: "weak",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
