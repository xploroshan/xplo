import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyWebhookSignature } from "@/lib/razorpay"
import { fulfillOrder } from "@/lib/orders"

// Razorpay webhook backstop: confirms payments even if the buyer closed the tab
// before the callback ran. Must read the RAW body for signature verification.
export async function POST(request: Request) {
  const raw = await request.text()
  const signature = request.headers.get("x-razorpay-signature") ?? ""

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 })
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const entity = event.payload?.payment?.entity
    const razorpayOrderId = entity?.order_id
    if (razorpayOrderId) {
      const order = await db.order.findUnique({
        where: { razorpayOrderId },
        select: { id: true },
      })
      if (order) await fulfillOrder(order.id, entity?.id)
    }
  }

  // Always 200 so Razorpay doesn't retry a handled (or irrelevant) event.
  return NextResponse.json({ received: true })
}
