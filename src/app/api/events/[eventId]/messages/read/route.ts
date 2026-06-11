import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEventChatAccess } from "@/lib/chat"

// Mark the event chat read up to now (drives unread counts in /messages).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { eventId } = await params
  const access = await getEventChatAccess(eventId, session.user.id, session.user.role)
  if (!access) {
    return NextResponse.json({ error: "No access" }, { status: 403 })
  }

  const now = new Date()
  await db.chatRead.upsert({
    where: { userId_eventId: { userId: session.user.id, eventId } },
    update: { lastReadAt: now },
    create: { userId: session.user.id, eventId, lastReadAt: now },
  })
  return NextResponse.json({ ok: true })
}
