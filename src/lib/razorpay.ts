import crypto from "crypto"
import Razorpay from "razorpay"

// Razorpay activates only when both keys are present; otherwise paid tickets
// surface as "not available" and free RSVP keeps working.
export function paymentsEnabled(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? ""

// Platform take-rate (marketplace fee), configurable; recorded per order.
export function platformFeePercent(): number {
  const v = Number(process.env.PLATFORM_FEE_PERCENT)
  return Number.isFinite(v) && v >= 0 && v <= 100 ? v : 0
}

let rz: Razorpay | null = null
function client(): Razorpay | null {
  if (!paymentsEnabled()) return null
  if (!rz) {
    rz = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  }
  return rz
}

/** Create a Razorpay order. amountPaise is INR × 100 (integer). */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes: Record<string, string>
): Promise<{ id: string }> {
  const c = client()
  if (!c) throw new Error("payments-not-configured")
  const order = await c.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    notes,
  })
  return { id: order.id }
}

/** Verify the checkout callback signature (order_id|payment_id, HMAC-SHA256). */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) return false
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex")
  return safeEqual(expected, signature)
}

/** Verify a webhook delivery against RAZORPAY_WEBHOOK_SECRET. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  return safeEqual(expected, signature)
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}
