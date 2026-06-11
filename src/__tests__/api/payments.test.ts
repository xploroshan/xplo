import { describe, it, expect, vi, beforeEach } from "vitest"
import crypto from "crypto"
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/razorpay"
import { fulfillOrder } from "@/lib/orders"
import { POST as VERIFY } from "@/app/api/orders/[orderId]/verify/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("Razorpay signatures", () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = "test_secret"
    process.env.RAZORPAY_WEBHOOK_SECRET = "wh_secret"
  })

  it("verifies a valid payment signature and rejects a forged one", () => {
    const orderId = "order_123"
    const paymentId = "pay_456"
    const sig = crypto.createHmac("sha256", "test_secret").update(`${orderId}|${paymentId}`).digest("hex")
    expect(verifyPaymentSignature(orderId, paymentId, sig)).toBe(true)
    expect(verifyPaymentSignature(orderId, paymentId, "deadbeef")).toBe(false)
  })

  it("verifies a webhook signature over the raw body", () => {
    const raw = JSON.stringify({ event: "payment.captured" })
    const sig = crypto.createHmac("sha256", "wh_secret").update(raw).digest("hex")
    expect(verifyWebhookSignature(raw, sig)).toBe(true)
    expect(verifyWebhookSignature(raw, "nope")).toBe(false)
  })
})

describe("fulfillOrder (idempotent)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("fulfills a pending order exactly once", async () => {
    mockDb.order.findUnique.mockResolvedValueOnce({
      id: "o1", status: "PENDING", eventId: "e1", userId: "u1", ticketTypeId: "tt1", quantity: 1,
    } as never)
    mockDb.order.update.mockResolvedValue({} as never)
    mockDb.ticketType.update.mockResolvedValue({} as never)
    mockDb.eventParticipant.upsert.mockResolvedValue({} as never)
    mockDb.event.findUnique.mockResolvedValue({ title: "Ride", slug: "ride", organizerId: "org" } as never)
    mockDb.user.findUnique.mockResolvedValue({ name: "Sam" } as never)
    mockDb.notification.create.mockResolvedValue({} as never)

    const first = await fulfillOrder("o1", "pay_1")
    expect(first).toBe(true)
    expect(mockDb.eventParticipant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { status: "CONFIRMED" } })
    )
    expect(mockDb.ticketType.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { sold: { increment: 1 } } })
    )
  })

  it("is a no-op for an already-paid order", async () => {
    mockDb.order.findUnique.mockResolvedValueOnce({
      id: "o1", status: "PAID", eventId: "e1", userId: "u1", ticketTypeId: "tt1", quantity: 1,
    } as never)
    const again = await fulfillOrder("o1", "pay_1")
    expect(again).toBe(false)
    expect(mockDb.eventParticipant.upsert).not.toHaveBeenCalled()
  })
})

describe("POST /api/orders/[id]/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RAZORPAY_KEY_SECRET = "test_secret"
  })

  it("rejects a forged signature and marks the order FAILED", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } } as never)
    mockDb.order.findUnique.mockResolvedValue({
      id: "o1", userId: "u1", razorpayOrderId: "order_x", event: { slug: "ride" },
    } as never)
    mockDb.order.update.mockResolvedValue({} as never)

    const res = await VERIFY(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ razorpayPaymentId: "pay_1", razorpaySignature: "forged" }),
      }),
      { params: Promise.resolve({ orderId: "o1" }) }
    )
    expect(res.status).toBe(400)
    expect(mockDb.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } })
    )
  })

  it("won't let one user verify another's order", async () => {
    mockAuth.mockResolvedValue({ user: { id: "intruder" } } as never)
    mockDb.order.findUnique.mockResolvedValue({
      id: "o1", userId: "u1", razorpayOrderId: "order_x", event: { slug: "ride" },
    } as never)

    const res = await VERIFY(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ razorpayPaymentId: "pay_1", razorpaySignature: "x" }),
      }),
      { params: Promise.resolve({ orderId: "o1" }) }
    )
    expect(res.status).toBe(404)
  })
})
