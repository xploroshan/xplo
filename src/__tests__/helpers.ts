import { vi } from "vitest"

export function createMockSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      role: "USER",
      ...overrides,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function createMockRequest(
  method: string,
  body?: unknown,
  url = "http://localhost:3000/api/test"
): Request {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  }
  if (body) {
    init.body = JSON.stringify(body)
  }
  return new Request(url, init)
}

export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  return { result, duration }
}

export function mockAuthSession(session: ReturnType<typeof createMockSession> | null) {
  const { auth } = require("@/lib/auth")
  vi.mocked(auth).mockResolvedValue(session)
}

export async function getResponseBody(response: Response) {
  return response.json()
}
