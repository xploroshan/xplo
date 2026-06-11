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

  let event: {
    event?: string
    payload?: {
      payment?: { entity?: { order_id?: string; id?: string } }
      order?: { entity?: { id?: string } }
    }
  }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 })
  }

  // payment.captured (primary) and order.paid carry the order id in different
  // places — resolve from whichever is present.
  let razorpayOrderId: string | undefined
  let paymentId: string | undefined
  if (event.event === "payment.captured") {
    razorpayOrderId = event.payload?.payment?.entity?.order_id
    paymentId = event.payload?.payment?.entity?.id
  } else if (event.event === "order.paid") {
    razorpayOrderId = event.payload?.order?.entity?.id
    paymentId = event.payload?.payment?.entity?.id
  }

  if (razorpayOrderId) {
    const order = await db.order.findUnique({
      where: { razorpayOrderId },
      select: { id: true },
    })
    if (order) await fulfillOrder(order.id, paymentId)
  }

  // Always 200 so Razorpay doesn't retry a handled (or irrelevant) event.
  return NextResponse.json({ received: true })
}
