import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Scheduled cleanup (Vercel Cron — see vercel.json). Removes data that has
// served its purpose so tables don't grow without bound.
//
// Secured with CRON_SECRET: Vercel sends `Authorization: Bearer <CRON_SECRET>`
// when that env var is set. If it isn't set, the route is open (fine for the
// first deploys, but set CRON_SECRET in production).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()

  try {
    // Used or expired password reset tokens.
    const tokens = await db.passwordResetToken.deleteMany({
      where: { OR: [{ used: true }, { expiresAt: { lt: now } }] },
    })

    // Expired stories (24h ephemeral posts) that aren't saved as highlights.
    const stories = await db.post.deleteMany({
      where: { isStory: true, isHighlight: false, expiresAt: { lt: now } },
    })

    // Archive event group chats 48h after the event completed (FR-3.3): the
    // chat becomes read-only.
    const archiveCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const archived = await db.event.updateMany({
      where: {
        status: "COMPLETED",
        chatActive: true,
        startDate: { lt: archiveCutoff },
      },
      data: { chatActive: false, chatArchivedAt: now },
    })

    return NextResponse.json({
      ok: true,
      deleted: { resetTokens: tokens.count, stories: stories.count },
      archivedChats: archived.count,
    })
  } catch (error) {
    console.error("Cron cleanup error:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
