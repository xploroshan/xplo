import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sanitizeInput } from "@/lib/sanitize"
import { micrositeFields } from "@/lib/validations/organization"
import { subdomainAvailable } from "@/lib/tenant"

const patchBody = z.object({
  name: z.string().min(2).max(60).optional(),
  bio: z.string().max(500).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  image: z.string().url().nullable().optional(),
  interests: z.array(z.string().min(1).max(40)).max(20).optional(),
  ...micrositeFields,
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
  if (d.themeColor !== undefined) data.themeColor = d.themeColor || null
  if (d.tagline !== undefined) data.tagline = d.tagline ? sanitizeInput(d.tagline) : null
  if (d.subdomain !== undefined) {
    if (d.subdomain === null || d.subdomain === "") {
      data.subdomain = null
    } else if (await subdomainAvailable(d.subdomain, { userId: session.user.id })) {
      data.subdomain = d.subdomain
    } else {
      return NextResponse.json({ error: "That subdomain isn't available" }, { status: 409 })
    }
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, bio: true, city: true, image: true, interests: true, subdomain: true, themeColor: true, tagline: true },
  })

  return NextResponse.json({ user: updated })
}
