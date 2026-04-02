import { describe, it, expect } from "vitest"
import { createEventSchema } from "@/lib/validations/event"

describe("createEventSchema", () => {
  const validEvent = {
    title: "Weekend Ride",
    eventTypeId: "type-1",
    startDate: "2024-12-01T10:00:00Z",
  }

  it("accepts valid minimal event", () => {
    const result = createEventSchema.safeParse(validEvent)
    expect(result.success).toBe(true)
  })

  it("accepts event with all optional fields", () => {
    const fullEvent = {
      ...validEvent,
      description: "A great ride through the mountains",
      endDate: "2024-12-01T18:00:00Z",
      startLocation: { lat: 19.076, lng: 72.877, address: "Mumbai" },
      destination: { lat: 18.52, lng: 73.856, address: "Pune" },
      capacity: 50,
      price: 500,
    }
    const result = createEventSchema.safeParse(fullEvent)
    expect(result.success).toBe(true)
  })

  it("rejects title shorter than 3 characters", () => {
    const result = createEventSchema.safeParse({ ...validEvent, title: "AB" })
    expect(result.success).toBe(false)
  })

  it("rejects title longer than 100 characters", () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      title: "A".repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it("rejects description longer than 5000 characters", () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      description: "A".repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing eventTypeId", () => {
    const { eventTypeId, ...noType } = validEvent
    const result = createEventSchema.safeParse(noType)
    expect(result.success).toBe(false)
  })

  it("rejects empty eventTypeId", () => {
    const result = createEventSchema.safeParse({ ...validEvent, eventTypeId: "" })
    expect(result.success).toBe(false)
  })

  it("rejects missing startDate", () => {
    const { startDate, ...noDate } = validEvent
    const result = createEventSchema.safeParse(noDate)
    expect(result.success).toBe(false)
  })

  it("rejects negative capacity", () => {
    const result = createEventSchema.safeParse({ ...validEvent, capacity: -1 })
    expect(result.success).toBe(false)
  })

  it("rejects zero capacity", () => {
    const result = createEventSchema.safeParse({ ...validEvent, capacity: 0 })
    expect(result.success).toBe(false)
  })

  it("rejects non-integer capacity", () => {
    const result = createEventSchema.safeParse({ ...validEvent, capacity: 10.5 })
    expect(result.success).toBe(false)
  })

  it("rejects negative price", () => {
    const result = createEventSchema.safeParse({ ...validEvent, price: -100 })
    expect(result.success).toBe(false)
  })

  it("accepts zero price (free event)", () => {
    const result = createEventSchema.safeParse({ ...validEvent, price: 0 })
    expect(result.success).toBe(true)
  })

  it("rejects location with missing fields", () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      startLocation: { lat: 19.076 },
    })
    expect(result.success).toBe(false)
  })
})
