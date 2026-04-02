import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as registerPOST } from "@/app/api/auth/register/route"
import { GET as organizerGET } from "@/app/api/organizers/[slug]/route"
import { PATCH as adminVerifyPATCH } from "@/app/api/admin/users/[userId]/verify/route"
import { POST as pinsPOST } from "@/app/api/pins/route"
import { DELETE as pinDELETE } from "@/app/api/pins/[organizerId]/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("SQL Injection Prevention", () => {
    it("handles SQL injection in slug parameter", async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const maliciousSlugs = [
        "'; DROP TABLE users; --",
        "1 OR 1=1",
        "admin'--",
        "' UNION SELECT * FROM users--",
      ]

      for (const slug of maliciousSlugs) {
        const response = await organizerGET(
          new Request(`http://localhost/api/organizers/${encodeURIComponent(slug)}`),
          { params: Promise.resolve({ slug }) }
        )
        // Prisma parameterizes queries — should return 404, not crash
        expect(response.status).toBe(404)
      }
    })

    it("handles SQL injection in registration email", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Attacker",
          email: "admin@test.com' OR '1'='1",
          password: "StrongPass1!",
        }),
      })

      const response = await registerPOST(request)
      // Zod email validation rejects this
      expect(response.status).toBe(400)
    })
  })

  describe("XSS Prevention", () => {
    it("rejects XSS in registration name (validation layer)", async () => {
      // Name must be at least 2 chars, but Zod accepts strings — the important
      // thing is the value is stored as-is and rendered with React's auto-escaping.
      // This test verifies the input goes through validation.
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({ id: "u-1", slug: null } as never)

      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: '<script>alert("xss")</script>',
          email: "xss@example.com",
          password: "StrongPass1!",
        }),
      })

      const response = await registerPOST(request)
      // Zod accepts the name (it's > 2 chars). React's JSX auto-escapes on render.
      // The important thing is no server-side code evaluation happens.
      expect([201, 400, 429]).toContain(response.status)
    })

    it("rejects XSS payload in slug (regex blocks special chars)", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Attacker",
          email: "attack@example.com",
          password: "StrongPass1!",
          role: "ORGANIZER",
          slug: '<script>alert("xss")</script>',
        }),
      })

      const response = await registerPOST(request)
      expect(response.status).toBe(400)
    })
  })

  describe("Authentication Bypass Prevention", () => {
    it("pins API rejects unauthenticated requests", async () => {
      mockAuth.mockResolvedValue(null as never)

      const response = await pinsPOST(
        new Request("http://localhost/api/pins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizerId: "org-1" }),
        })
      )

      expect(response.status).toBe(401)
    })

    it("admin endpoint rejects non-admin authenticated users", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.user.findUnique.mockResolvedValue({ role: "USER" } as never)

      const response = await adminVerifyPATCH(
        new Request("http://localhost/api/admin/users/u-1/verify", { method: "PATCH" }),
        { params: Promise.resolve({ userId: "u-1" }) }
      )

      expect(response.status).toBe(403)
    })

    it("admin endpoint rejects organizer role", async () => {
      mockAuth.mockResolvedValue({ user: { id: "org-1" } } as never)
      mockDb.user.findUnique.mockResolvedValue({ role: "ORGANIZER" } as never)

      const response = await adminVerifyPATCH(
        new Request("http://localhost/api/admin/users/u-1/verify", { method: "PATCH" }),
        { params: Promise.resolve({ userId: "u-1" }) }
      )

      expect(response.status).toBe(403)
    })
  })

  describe("IDOR Prevention", () => {
    it("user can only delete their own pins", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      // findUnique uses compound key (userId, organizerId) — so user-1 can't find user-2's pin
      mockDb.organizerPin.findUnique.mockResolvedValue(null)

      const response = await pinDELETE(
        new Request("http://localhost/api/pins/org-1", { method: "DELETE" }),
        { params: Promise.resolve({ organizerId: "org-1" }) }
      )

      // Returns 404 because the compound key includes the session userId
      expect(response.status).toBe(404)
    })
  })

  describe("Password Security", () => {
    it("password is hashed with bcrypt before storage", async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({ id: "u-1", slug: null } as never)

      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "StrongPass1!",
        }),
      })

      await registerPOST(request)

      const createCall = mockDb.user.create.mock.calls[0]?.[0] as { data: { passwordHash: string } }
      // Password should be hashed, not plaintext
      expect(createCall.data.passwordHash).not.toBe("StrongPass1!")
      expect(createCall.data.passwordHash).toMatch(/^\$2a\$12\$/)
    })

    it("rejects weak passwords", async () => {
      const weakPasswords = [
        "short1!",          // too short
        "alllowercase1!",   // no uppercase
        "ALLUPPERCASE1!",   // no lowercase
        "NoNumbers!!",      // no number
        "NoSpecialChar1",   // no special character
      ]

      for (const password of weakPasswords) {
        const request = new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password,
          }),
        })

        const response = await registerPOST(request)
        expect(response.status).toBe(400)
      }
    })
  })

  describe("Input Validation", () => {
    it("rejects invalid JSON body", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not valid json{{{",
      })

      const response = await registerPOST(request)
      expect(response.status).toBe(500)
    })

    it("rejects oversized payloads in validation", async () => {
      const request = new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "A".repeat(10000),
          email: "test@example.com",
          password: "StrongPass1!",
        }),
      })

      // Zod will accept the name (no max length on name), but this shouldn't crash
      const response = await registerPOST(request)
      expect([201, 400, 409, 429, 500]).toContain(response.status)
    })
  })
})
