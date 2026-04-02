import { describe, it, expect, vi, beforeEach } from "vitest"
import { loginSchema, registerSchema, slugSchema } from "@/lib/validations/auth"
import { createEventSchema } from "@/lib/validations/event"
import { pinOrganizerSchema, followOrganizerSchema } from "@/lib/validations/organizer"
import { POST as registerPOST } from "@/app/api/auth/register/route"
import { GET as organizerGET } from "@/app/api/organizers/[slug]/route"
import { POST as pinsPOST } from "@/app/api/pins/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Validation Schema Performance", () => {
    it("loginSchema parses under 5ms", () => {
      const start = performance.now()
      loginSchema.safeParse({ email: "test@example.com", password: "pass123" })
      const duration = performance.now() - start
      expect(duration).toBeLessThan(5)
    })

    it("registerSchema parses under 5ms", () => {
      const start = performance.now()
      registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "StrongPass1!",
        role: "USER",
      })
      const duration = performance.now() - start
      expect(duration).toBeLessThan(5)
    })

    it("slugSchema parses under 5ms", () => {
      const start = performance.now()
      slugSchema.safeParse("my-awesome-slug")
      const duration = performance.now() - start
      expect(duration).toBeLessThan(5)
    })

    it("createEventSchema parses under 5ms", () => {
      const start = performance.now()
      createEventSchema.safeParse({
        title: "Weekend Ride",
        eventTypeId: "type-1",
        startDate: "2024-12-01T10:00:00Z",
        capacity: 50,
        price: 100,
      })
      const duration = performance.now() - start
      expect(duration).toBeLessThan(5)
    })

    it("bulk validation: 100 schemas parsed under 500ms", () => {
      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        registerSchema.safeParse({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: "StrongPass1!",
          role: "USER",
        })
      }
      const duration = performance.now() - start
      expect(duration).toBeLessThan(500)
    })

    it("invalid data validation is also fast (under 5ms)", () => {
      const start = performance.now()
      registerSchema.safeParse({
        name: "J",
        email: "invalid",
        password: "weak",
        role: "INVALID",
      })
      const duration = performance.now() - start
      expect(duration).toBeLessThan(5)
    })
  })

  describe("API Handler Performance (mocked DB)", () => {
    it("registration handler responds under 100ms", async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({ id: "u-1", slug: null } as never)

      const start = performance.now()
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
      const duration = performance.now() - start

      expect(duration).toBeLessThan(100)
    })

    it("organizer profile fetch responds under 50ms", async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: "org-1",
        name: "Org",
        role: "ORGANIZER",
        _count: { organizedEvents: 5, followers: 10 },
      } as never)
      mockDb.eventParticipant.aggregate
        .mockResolvedValueOnce({ _count: 100 } as never)
        .mockResolvedValueOnce({ _avg: { rating: 4.5 }, _count: { rating: 20 } } as never)

      const start = performance.now()
      await organizerGET(
        new Request("http://localhost/api/organizers/org-test"),
        { params: Promise.resolve({ slug: "org-test" }) }
      )
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
    })

    it("pins creation responds under 50ms", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never)
      mockDb.user.findUnique.mockResolvedValue({ role: "ORGANIZER" } as never)
      mockDb.$transaction.mockImplementation(async (fn) => {
        return fn({
          organizerPin: {
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockResolvedValue({ id: "pin-1", organizer: {} }),
          },
        } as never)
      })

      const start = performance.now()
      await pinsPOST(
        new Request("http://localhost/api/pins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizerId: "org-1" }),
        })
      )
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
    })
  })

  describe("Validation Throughput", () => {
    it("processes 1000 pin validations under 1 second", () => {
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        pinOrganizerSchema.safeParse({ organizerId: `org-${i}` })
      }
      const duration = performance.now() - start
      expect(duration).toBeLessThan(1000)
    })

    it("processes 1000 follow validations under 1 second", () => {
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        followOrganizerSchema.safeParse({ organizerId: `org-${i}` })
      }
      const duration = performance.now() - start
      expect(duration).toBeLessThan(1000)
    })
  })
})
