import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// List the current user's notifications + unread count (used by the bell).
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        link: true,
        read: true,
        createdAt: true,
      },
    }),
    db.notification.count({ where: { userId: session.user.id, read: false } }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

// Mark all of the user's notifications as read.
export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })
  return NextResponse.json({ ok: true })
}
