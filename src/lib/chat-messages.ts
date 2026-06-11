import { db } from "@/lib/db"

// Metadata stored on Message.metadata (a single JSON column) for richer types.
export interface MsgMeta {
  imageUrl?: string
  mentions?: string[] // userIds mentioned
  reactions?: Record<string, string[]> // emoji -> userIds who reacted
  poll?: { question: string; options: string[]; votes: Record<string, string[]>; multi?: boolean }
}

export const MESSAGE_SELECT = {
  id: true,
  content: true,
  type: true,
  metadata: true,
  pinned: true,
  deleted: true,
  editedAt: true,
  createdAt: true,
  senderId: true,
  sender: { select: { id: true, name: true, image: true } },
  replyTo: {
    select: { id: true, content: true, deleted: true, sender: { select: { name: true } } },
  },
} as const

interface RawMessage {
  id: string
  content: string
  type: string
  metadata: unknown
  pinned: boolean
  deleted: boolean
  editedAt: Date | null
  createdAt: Date
  senderId: string
  sender: { id: string; name: string | null; image: string | null }
  replyTo: { id: string; content: string; deleted: boolean; sender: { name: string | null } } | null
}

// Shape a stored message for the client (hides deleted content, summarizes
// reactions/polls relative to the viewer).
export function presentMessage(m: RawMessage, me: string) {
  const meta = (m.metadata as MsgMeta | null) ?? {}
  const reactions = Object.entries(meta.reactions ?? {})
    .filter(([, users]) => users.length > 0)
    .map(([emoji, users]) => ({ emoji, count: users.length, mine: users.includes(me) }))

  const poll = meta.poll
    ? {
        question: meta.poll.question,
        multi: !!meta.poll.multi,
        options: meta.poll.options.map((text, i) => {
          const votes = meta.poll!.votes[String(i)] ?? []
          return { text, votes: votes.length, mine: votes.includes(me) }
        }),
        totalVoters: new Set(Object.values(meta.poll.votes).flat()).size,
      }
    : null

  return {
    id: m.id,
    content: m.deleted ? null : m.content,
    type: m.type,
    imageUrl: m.deleted ? null : meta.imageUrl ?? null,
    mentions: meta.mentions ?? [],
    reactions,
    poll: m.deleted ? null : poll,
    pinned: m.pinned,
    deleted: m.deleted,
    editedAt: m.editedAt,
    createdAt: m.createdAt,
    senderId: m.senderId,
    sender: m.sender,
    replyTo: m.replyTo
      ? { id: m.replyTo.id, content: m.replyTo.deleted ? null : m.replyTo.content, senderName: m.replyTo.sender.name }
      : null,
  }
}

// Resolve @handles in text to event members (by slug or first name). Returns the
// matched userIds. Members come from getEventMembers().
export function resolveMentions(
  content: string,
  members: { id: string; name: string | null; slug: string | null }[]
): string[] {
  const handles = [...content.matchAll(/@([a-zA-Z0-9_]+)/g)].map((m) => m[1].toLowerCase())
  if (handles.length === 0) return []
  const matched = new Set<string>()
  for (const member of members) {
    const slug = member.slug?.toLowerCase()
    const first = member.name?.trim().split(/\s+/)[0]?.toLowerCase()
    if ((slug && handles.includes(slug)) || (first && handles.includes(first))) {
      matched.add(member.id)
    }
  }
  return [...matched]
}

// Members who can be @mentioned: confirmed participants + the organizer.
export async function getEventMembers(eventId: string) {
  const [parts, event] = await Promise.all([
    db.eventParticipant.findMany({
      where: { eventId, status: "CONFIRMED" },
      select: { user: { select: { id: true, name: true, slug: true } } },
    }),
    db.event.findUnique({
      where: { id: eventId },
      select: { organizer: { select: { id: true, name: true, slug: true } } },
    }),
  ])
  const members = parts.map((p) => p.user)
  if (event?.organizer) members.push(event.organizer)
  return members
}
