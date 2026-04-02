import { describe, it, expect } from "vitest"
import {
  upgradeToOrganizerSchema,
  pinOrganizerSchema,
  followOrganizerSchema,
} from "@/lib/validations/organizer"

describe("upgradeToOrganizerSchema", () => {
  it("accepts empty object (slug optional)", () => {
    const result = upgradeToOrganizerSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts valid slug", () => {
    const result = upgradeToOrganizerSchema.safeParse({ slug: "my-events" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid slug (too short)", () => {
    const result = upgradeToOrganizerSchema.safeParse({ slug: "ab" })
    expect(result.success).toBe(false)
  })

  it("rejects slug with uppercase", () => {
    const result = upgradeToOrganizerSchema.safeParse({ slug: "MyEvents" })
    expect(result.success).toBe(false)
  })
})

describe("pinOrganizerSchema", () => {
  it("accepts valid organizer ID", () => {
    const result = pinOrganizerSchema.safeParse({ organizerId: "org-123" })
    expect(result.success).toBe(true)
  })

  it("rejects empty organizer ID", () => {
    const result = pinOrganizerSchema.safeParse({ organizerId: "" })
    expect(result.success).toBe(false)
  })

  it("rejects missing organizer ID", () => {
    const result = pinOrganizerSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("followOrganizerSchema", () => {
  it("accepts valid organizer ID", () => {
    const result = followOrganizerSchema.safeParse({ organizerId: "org-456" })
    expect(result.success).toBe(true)
  })

  it("rejects empty organizer ID", () => {
    const result = followOrganizerSchema.safeParse({ organizerId: "" })
    expect(result.success).toBe(false)
  })

  it("rejects missing organizer ID", () => {
    const result = followOrganizerSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
