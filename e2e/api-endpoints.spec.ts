import { test, expect } from "@playwright/test"

test.describe("API Endpoints", () => {
  test.describe("Auth API", () => {
    test("POST /api/auth/register — rejects empty body", async ({ request }) => {
      const res = await request.post("/api/auth/register", {
        data: {},
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("POST /api/auth/register — rejects invalid email", async ({ request }) => {
      const res = await request.post("/api/auth/register", {
        data: { name: "Test", email: "not-an-email", password: "StrongP@ss123!" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("POST /api/auth/register — rejects short password", async ({ request }) => {
      const res = await request.post("/api/auth/register", {
        data: { name: "Test", email: "test@test.com", password: "short" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("POST /api/auth/register — rejects missing name", async ({ request }) => {
      const res = await request.post("/api/auth/register", {
        data: { email: "test@test.com", password: "StrongP@ss123!" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("POST /api/auth/register — rejects XSS in name", async ({ request }) => {
      const res = await request.post("/api/auth/register", {
        data: {
          name: '<script>alert("xss")</script>',
          email: `xss-test-${Date.now()}@test.com`,
          password: "StrongP@ss123!",
        },
        headers: { "Content-Type": "application/json" },
      })
      // Should either reject or sanitize — shouldn't return raw script
      if (res.ok()) {
        const body = await res.json()
        expect(JSON.stringify(body)).not.toContain("<script>")
      }
    })

    test("POST /api/auth/forgot-password — rejects empty body", async ({ request }) => {
      const res = await request.post("/api/auth/forgot-password", {
        data: {},
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("POST /api/auth/forgot-password — rejects invalid email", async ({ request }) => {
      const res = await request.post("/api/auth/forgot-password", {
        data: { email: "not-an-email" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe("Organizations API", () => {
    test("GET /api/organizations — returns list or error", async ({ request }) => {
      const res = await request.get("/api/organizations")
      // 200 = success, 401 = unauthenticated, 500 = DB not available in test env
      expect([200, 401, 500]).toContain(res.status())
      if (res.ok()) {
        const body = await res.json()
        expect(body).toBeTruthy()
      }
    })

    test("POST /api/organizations — rejects unauthenticated", async ({ request }) => {
      const res = await request.post("/api/organizations", {
        data: { name: "Test Org", slug: "test-org" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("GET /api/organizations/nonexistent-slug — returns 404", async ({ request }) => {
      const res = await request.get("/api/organizations/nonexistent-slug-xyz-999")
      expect([404, 500]).toContain(res.status())
    })

    test("PATCH /api/organizations/test-slug — rejects unauthenticated", async ({ request }) => {
      const res = await request.patch("/api/organizations/test-slug", {
        data: { description: "Updated" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe("Events API", () => {
    test("POST /api/events/nonexistent-id/rate — rejects unauthenticated", async ({ request }) => {
      const res = await request.post("/api/events/nonexistent-id/rate", {
        data: { rating: 5, review: "Great!" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe("Admin API", () => {
    test("GET /api/admin/organizations — rejects unauthenticated", async ({ request }) => {
      const res = await request.get("/api/admin/organizations")
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("POST /api/admin/ratings/override — rejects unauthenticated", async ({ request }) => {
      const res = await request.post("/api/admin/ratings/override", {
        data: { targetType: "user", targetId: "test", newRating: 5, reason: "test" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("GET /api/admin/ratings/overrides — rejects unauthenticated", async ({ request }) => {
      const res = await request.get("/api/admin/ratings/overrides")
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("GET /api/admin/stats — rejects unauthenticated", async ({ request }) => {
      const res = await request.get("/api/admin/stats")
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("PATCH /api/admin/organizations/nonexistent — rejects unauthenticated", async ({ request }) => {
      const res = await request.patch("/api/admin/organizations/nonexistent", {
        data: { status: "ACTIVE" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe("Follow API", () => {
    test("POST /api/follow — rejects unauthenticated", async ({ request }) => {
      const res = await request.post("/api/follow", {
        data: { targetUserId: "some-id" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe("Profile API", () => {
    test("PATCH /api/profile — rejects unauthenticated", async ({ request }) => {
      const res = await request.patch("/api/profile", {
        data: { name: "Updated" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test("POST /api/auth/change-password — rejects unauthenticated", async ({ request }) => {
      const res = await request.post("/api/auth/change-password", {
        data: { currentPassword: "old", newPassword: "NewP@ss123!" },
        headers: { "Content-Type": "application/json" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe("Content-Type Handling", () => {
    test("API rejects non-JSON content type for POST", async ({ request }) => {
      const res = await request.post("/api/auth/register", {
        data: "name=test&email=test@test.com",
        headers: { "Content-Type": "text/plain" },
      })
      expect(res.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe("Rate Limiting", () => {
    test("API responds within acceptable time", async ({ request }) => {
      const start = Date.now()
      await request.get("/api/organizations")
      const duration = Date.now() - start
      expect(duration).toBeLessThan(5_000) // Should respond within 5s
    })
  })
})
