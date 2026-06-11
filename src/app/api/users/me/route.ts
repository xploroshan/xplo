import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sanitizeInput } from "@/lib/sanitize"

const patchBody = z.object({
  name: z.string().min(2).max(60).optional(),
  bio: z.string().max(500).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  image: z.string().url().nullable().optional(),
  interests: z.array(z.string().min(1).max(40)).max(20).optional(),
})

// Update the signed-in user's profile.
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = patchBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }
  const d = parsed.data

  const data: Record<string, unknown> = {}
  if (d.name !== undefined) data.name = sanitizeInput(d.name)
  if (d.bio !== undefined) data.bio = d.bio ? sanitizeInput(d.bio) : null
  if (d.city !== undefined) data.city = d.city || null
  if (d.image !== undefined) data.image = d.image
  if (d.interests !== undefined) data.interests = d.interests

  const updated = await db.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, bio: true, city: true, image: true, interests: true },
  })

  return NextResponse.json({ user: updated })
}
