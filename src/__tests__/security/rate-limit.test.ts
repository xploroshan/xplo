import { describe, it, expect } from "vitest"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

describe("Rate Limiter", () => {
  it("allows requests within limit", () => {
    const key = `test-allow-${Date.now()}`
    const result = rateLimit(key, 5, 60000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("decrements remaining count", () => {
    const key = `test-decrement-${Date.now()}`
    rateLimit(key, 5, 60000)
    const result = rateLimit(key, 5, 60000)
    expect(result.remaining).toBe(3)
  })

  it("blocks requests exceeding limit", () => {
    const key = `test-block-${Date.now()}`
    for (let i = 0; i < 3; i++) {
      rateLimit(key, 3, 60000)
    }
    const result = rateLimit(key, 3, 60000)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("resets after window expires", () => {
    const key = `test-reset-${Date.now()}`
    // Use a very short window (1ms)
    rateLimit(key, 1, 1)
    // Wait a tiny bit
    const start = Date.now()
    while (Date.now() - start < 5) {
      // busy wait
    }
    const result = rateLimit(key, 1, 1)
    expect(result.success).toBe(true)
  })

  it("tracks different keys independently", () => {
    const key1 = `test-key1-${Date.now()}`
    const key2 = `test-key2-${Date.now()}`

    for (let i = 0; i < 3; i++) {
      rateLimit(key1, 3, 60000)
    }

    const result1 = rateLimit(key1, 3, 60000)
    const result2 = rateLimit(key2, 3, 60000)

    expect(result1.success).toBe(false)
    expect(result2.success).toBe(true)
  })
})

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    })
    expect(getClientIp(request)).toBe("1.2.3.4")
  })

  it("falls back to x-real-ip", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "9.8.7.6" },
    })
    expect(getClientIp(request)).toBe("9.8.7.6")
  })

  it("returns unknown when no IP headers", () => {
    const request = new Request("http://localhost")
    expect(getClientIp(request)).toBe("unknown")
  })
})
