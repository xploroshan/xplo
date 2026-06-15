/**
 * Rate limiter with a durable Upstash Redis backend (shared across all
 * serverless instances) and an in-memory fallback for local dev / tests, or
 * before the Upstash env vars are configured.
 *
 * Same call shape everywhere — note it is now async:
 *   const { success } = await rateLimit(key, maxRequests, windowMs)
 */

import { Redis } from "@upstash/redis"

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store — fallback only. On serverless this is per-instance and not
// shared, which is exactly why Upstash is preferred in production.
const store = new Map<string, RateLimitEntry>()

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// Cleanup expired in-memory entries every 5 minutes (dev fallback only).
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

function memoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: maxRequests - entry.count }
}

/**
 * Check if a request should be rate limited (fixed window).
 * @param key - Unique identifier (e.g., IP address or user ID)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  // Opt-in bypass for deterministic E2E runs (never set in production).
  if (process.env.E2E_DISABLE_RATE_LIMIT === "1") {
    return { success: true, remaining: maxRequests }
  }

  if (!redis) {
    return memoryRateLimit(key, maxRequests, windowMs)
  }

  try {
    const redisKey = `rl:${key}`
    const count = await redis.incr(redisKey)
    // First hit in this window — set the expiry.
    if (count === 1) {
      await redis.pexpire(redisKey, windowMs)
    }
    return {
      success: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
    }
  } catch (err) {
    // Never hard-fail a request because Redis hiccupped — fall back to memory.
    console.error("rate-limit redis error, using in-memory fallback:", err)
    return memoryRateLimit(key, maxRequests, windowMs)
  }
}

/**
 * Get the client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

/**
 * Reset the in-memory rate limit store. Used in tests.
 */
export function resetRateLimitStore(): void {
  store.clear()
}
