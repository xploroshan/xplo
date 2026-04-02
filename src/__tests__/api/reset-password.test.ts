import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/auth/reset-password/route"
import { db } from "@/lib/db"

const mockDb = vi.mocked(db)

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validToken = {
    id: "token-1",
    token: "validtoken123",
    email: "test@example.com",
    used: false,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  }

  it("resets password with valid token", async () => {
    mockDb.passwordResetToken.findUnique.mockResolvedValue(validToken as never)
    mockDb.user.update.mockResolvedValue({} as never)
    mockDb.passwordResetToken.update.mockResolvedValue({} as never)

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "validtoken123",
        newPassword: "NewSecure1!",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Password has been reset successfully")
    expect(mockDb.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "test@example.com" },
        data: expect.objectContaining({
          failedLoginAttempts: 0,
          lockedUntil: null,
        }),
      })
    )
    expect(mockDb.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { used: true },
      })
    )
  })

  it("returns 400 for invalid token", async () => {
    mockDb.passwordResetToken.findUnique.mockResolvedValue(null)

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "invalidtoken",
        newPassword: "NewSecure1!",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 for used token", async () => {
    mockDb.passwordResetToken.findUnique.mockResolvedValue({
      ...validToken,
      used: true,
    } as never)

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "usedtoken",
        newPassword: "NewSecure1!",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 for expired token", async () => {
    mockDb.passwordResetToken.findUnique.mockResolvedValue({
      ...validToken,
      expiresAt: new Date(Date.now() - 1000), // expired
    } as never)

    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "expiredtoken",
        newPassword: "NewSecure1!",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 for weak new password", async () => {
    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "sometoken",
        newPassword: "weak",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 400 when token is empty", async () => {
    const request = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "",
        newPassword: "NewSecure1!",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
