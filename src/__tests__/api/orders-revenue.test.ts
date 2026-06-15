import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET } from "@/app/api/events/[eventId]/orders/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

const params = (eventId = "e-1") => ({ params: Promise.resolve({ eventId }) })
const req = () => new Request("http://localhost/api/events/e-1/orders")

describe("Organizer revenue (orders GET)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("401s when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET(req(), params())
    expect(res.status).toBe(401)
  })

  it("403s for a non-organizer, non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "rando", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue({ organizerId: "owner-1" } as never)
    const res = await GET(req(), params())
    expect(res.status).toBe(403)
  })

  it("returns orders + aggregated summary for the organizer", async () => {
    mockAuth.mockResolvedValue({ user: { id: "owner-1", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue({ organizerId: "owner-1" } as never)
    mockDb.order.findMany.mockResolvedValue([
      {
        id: "o-1", quantity: 2, amount: 1000, platformFee: 50, currency: "INR",
        createdAt: new Date(), razorpayPaymentId: "pay_1",
        ticketType: { name: "Early Bird" }, user: { name: "Asha" },
      },
      {
        id: "o-2", quantity: 1, amount: 600, platformFee: 30, currency: "INR",
        createdAt: new Date(), razorpayPaymentId: "pay_2",
        ticketType: { name: "Regular" }, user: { name: "Ravi" },
      },
    ] as never)

    const res = await GET(req(), params())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.summary).toMatchObject({ gross: 1600, fees: 80, net: 1520, count: 2, tickets: 3 })
    expect(data.orders[0]).toMatchObject({ buyer: "Asha", tier: "Early Bird", net: 950 })
  })

  it("admins can view another organizer's revenue", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as never)
    mockDb.event.findUnique.mockResolvedValue({ organizerId: "owner-1" } as never)
    mockDb.order.findMany.mockResolvedValue([] as never)
    const res = await GET(req(), params())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.summary.count).toBe(0)
  })
})
