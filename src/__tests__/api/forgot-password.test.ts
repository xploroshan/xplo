import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/auth/forgot-password/route"
import { db } from "@/lib/db"

const mockDb = vi.mocked(db)

// Mock crypto
vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: () => "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    })),
  },
  randomBytes: vi.fn(() => ({
    toString: () => "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  })),
}))

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 200 for existing user with password", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: "$2a$12$hashed",
      email: "test@example.com",
    } as never)
    mockDb.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 } as never)
    mockDb.passwordResetToken.create.mockResolvedValue({} as never)

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain("If an account")
    expect(mockDb.passwordResetToken.create).toHaveBeenCalled()
  })

  it("returns 200 for non-existent email (no enumeration)", async () => {
    mockDb.user.findUnique.mockResolvedValue(null)

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@example.com" }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain("If an account")
    expect(mockDb.passwordResetToken.create).not.toHaveBeenCalled()
  })

  it("does not create token for OAuth-only user (no passwordHash)", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: null,
      email: "oauth@example.com",
    } as never)

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "oauth@example.com" }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockDb.passwordResetToken.create).not.toHaveBeenCalled()
  })

  it("deletes existing tokens before creating new one", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      passwordHash: "$2a$12$hashed",
      email: "test@example.com",
    } as never)
    mockDb.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 } as never)
    mockDb.passwordResetToken.create.mockResolvedValue({} as never)

    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    })

    await POST(request)

    expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    })
  })

  it("returns 400 for invalid email", async () => {
    const request = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid" }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
