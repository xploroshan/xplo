import { vi, beforeEach } from "vitest"
import { resetRateLimitStore } from "@/lib/rate-limit"

// Reset rate limiter between all tests
beforeEach(() => {
  resetRateLimitStore()
})

// Mock next/server
vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server") as Record<string, unknown>
  return {
    ...actual,
    NextResponse: {
      json: (body: unknown, init?: ResponseInit) => {
        const response = new Response(JSON.stringify(body), {
          ...init,
          headers: {
            "content-type": "application/json",
            ...(init?.headers || {}),
          },
        })
        return response
      },
      next: () => {
        const response = new Response(null, { status: 200 })
        const headers = new Map<string, string>()
        return {
          headers: {
            set: (key: string, value: string) => headers.set(key, value),
            get: (key: string) => headers.get(key),
            entries: () => headers.entries(),
          },
          status: 200,
          _headers: headers,
        }
      },
      redirect: (url: URL) => {
        return {
          status: 307,
          headers: new Headers({ Location: url.toString() }),
          redirected: true,
          url: url.toString(),
        }
      },
    },
  }
})

// Mock @/lib/auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock @/lib/db
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    eventParticipant: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    organizerPin: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    follow: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
    compare: vi.fn(),
  },
  hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
  compare: vi.fn(),
}))

// Mock slugify
vi.mock("slugify", () => ({
  default: vi.fn((str: string) => str.toLowerCase().replace(/\s+/g, "-")),
}))

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "abcd"),
}))
