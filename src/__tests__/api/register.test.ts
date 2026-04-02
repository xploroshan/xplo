import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/auth/register/route"
import { db } from "@/lib/db"

const mockDb = vi.mocked(db)

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validBody = {
    name: "John Doe",
    email: "john@example.com",
    password: "StrongPass1!",
    role: "USER",
  }

  it("creates a new user successfully", async () => {
    mockDb.user.findUnique.mockResolvedValue(null)
    mockDb.user.create.mockResolvedValue({
      id: "user-1",
      name: "John Doe",
      email: "john@example.com",
      slug: null,
    } as never)

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe("Account created successfully")
  })

  it("creates an organizer with slug", async () => {
    mockDb.user.findUnique.mockResolvedValue(null)
    mockDb.user.create.mockResolvedValue({
      id: "user-2",
      name: "Jane Org",
      email: "jane@example.com",
      slug: "jane-org",
    } as never)

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validBody,
        name: "Jane Org",
        email: "jane@example.com",
        role: "ORGANIZER",
        slug: "jane-org",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.slug).toBe("jane-org")
  })

  it("returns 409 for duplicate email", async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: "existing" } as never)

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request)
    expect(response.status).toBe(409)
  })

  it("returns 400 for invalid data", async () => {
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "J", email: "invalid", password: "weak" }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it("returns 409 when organizer slug is taken", async () => {
    // First call for email check returns null, second for slug check returns a user
    mockDb.user.findUnique
      .mockResolvedValueOnce(null) // email check
      .mockResolvedValueOnce({ id: "other" } as never) // slug taken

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validBody,
        role: "ORGANIZER",
        slug: "taken-slug",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(409)
  })

  it("hashes password before storing", async () => {
    mockDb.user.findUnique.mockResolvedValue(null)
    mockDb.user.create.mockResolvedValue({ id: "user-1", slug: null } as never)

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    })

    await POST(request)

    expect(mockDb.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: expect.stringContaining("$2a$12$"),
        }),
      })
    )
  })

  it("returns 500 on database error", async () => {
    mockDb.user.findUnique.mockRejectedValue(new Error("DB connection failed"))

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
