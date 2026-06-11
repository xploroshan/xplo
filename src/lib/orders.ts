import { db } from "@/lib/db"

/**
 * Fulfill a paid order exactly once: mark PAID, bump the ticket tier's sold
 * count, confirm the buyer as an EventParticipant (so they get the roster, chat,
 * pass and tracking), and notify the organizer. Idempotent — safe to call from
 * both the checkout-callback verify route and the webhook.
 *
 * @returns true if this call performed the fulfillment, false if already done.
 */
export async function fulfillOrder(orderId: string, razorpayPaymentId?: string): Promise<boolean> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, eventId: true, userId: true, ticketTypeId: true, quantity: true },
  })
  if (!order) return false
  if (order.status === "PAID") return false // already fulfilled

  await db.order.update({
    where: { id: order.id },
    data: { status: "PAID", razorpayPaymentId: razorpayPaymentId ?? undefined },
  })

  if (order.ticketTypeId) {
    await db.ticketType.update({
      where: { id: order.ticketTypeId },
      data: { sold: { increment: order.quantity } },
    })
  }

  // Confirm the buyer as a participant (create or flip an existing row).
  await db.eventParticipant.upsert({
    where: { userId_eventId: { userId: order.userId, eventId: order.eventId } },
    update: { status: "CONFIRMED" },
    create: { userId: order.userId, eventId: order.eventId, status: "CONFIRMED" },
  })

  const event = await db.event.findUnique({
    where: { id: order.eventId },
    select: { title: true, slug: true, organizerId: true },
  })
  if (event) {
    const buyer = await db.user.findUnique({ where: { id: order.userId }, select: { name: true } })
    await db.notification.create({
      data: {
        type: "SYSTEM",
        title: "Ticket sold",
        content: `${buyer?.name || "Someone"} bought a ticket for "${event.title}"`,
        link: `/events/${event.slug}/manage`,
        userId: event.organizerId,
        senderId: order.userId,
      },
    })
  }

  return true
}
