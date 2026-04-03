import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { overrideRating } from "@/lib/ratings"
import { z } from "zod/v4"

const overrideRatingSchema = z.object({
  targetType: z.enum(["organization", "user", "event"]),
  targetId: z.string().min(1),
  newValue: z.number().min(1).max(5).nullable(),
  reason: z.string().min(1).max(1000),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // SUPER_ADMIN only
    const admin = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Rate limit: 20 per hour
    const { success } = rateLimit(`rating-override:${session.user.id}`, 20, 60 * 60 * 1000)
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
    }

    const body = await request.json()
    const parsed = overrideRatingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 })
    }

    const { targetType, targetId, newValue, reason } = parsed.data

    // Validate target exists
    if (targetType === "organization") {
      const org = await db.organization.findUnique({ where: { id: targetId } })
      if (!org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
      }
    } else if (targetType === "user") {
      const user = await db.user.findUnique({ where: { id: targetId } })
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    } else if (targetType === "event") {
      const event = await db.event.findUnique({ where: { id: targetId } })
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
    }

    await overrideRating(session.user.id, targetType, targetId, newValue, reason)

    return NextResponse.json({ message: "Rating override applied successfully" })
  } catch (error) {
    console.error("Rating override error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
