import { db } from "@/lib/db"

export type ChatRole = "ORGANIZER" | "MODERATOR" | "MEMBER"

export interface ChatAccess {
  event: {
    id: string
    slug: string
    title: string
    status: string
    chatActive: boolean
    organizerId: string
  }
  role: ChatRole
  /** Organizer, admin, or moderator — may pin and delete others' messages. */
  canModerate: boolean
}

/**
 * Resolve a user's access to an event's group chat. The "group" is simply the
 * event's confirmed participants plus its organizer (FR-3.1/3.2) — no separate
 * membership table needed. Returns null if the user can't access the chat.
 */
export async function getEventChatAccess(
  eventId: string,
  userId: string,
  userRole?: string
): Promise<ChatAccess | null> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, slug: true, title: true, status: true, chatActive: true, organizerId: true },
  })
  if (!event) return null

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
  if (event.organizerId === userId || isAdmin) {
    return { event, role: "ORGANIZER", canModerate: true }
  }

  const participant = await db.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { status: true, role: true },
  })
  if (!participant || participant.status !== "CONFIRMED") return null

  const role: ChatRole = participant.role === "MODERATOR" ? "MODERATOR" : "MEMBER"
  return { event, role, canModerate: role === "MODERATOR" }
}
