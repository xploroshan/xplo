import { db } from "@/lib/db"

// 1:1 conversations are keyed by the sorted user-id pair so either party
// resolves to the same row.
export async function getOrCreateConversation(meId: string, otherId: string) {
  if (meId === otherId) return null
  const [userAId, userBId] = [meId, otherId].sort()
  return db.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
    select: { id: true, userAId: true, userBId: true },
  })
}

export async function getConversationAccess(conversationId: string, userId: string) {
  const c = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userAId: true, userBId: true },
  })
  if (!c || (c.userAId !== userId && c.userBId !== userId)) return null
  return { conversation: c, otherId: c.userAId === userId ? c.userBId : c.userAId }
}
