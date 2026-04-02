import { NextResponse } from "next/server"
import slugify from "slugify"
import { nanoid } from "nanoid"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { upgradeToOrganizerSchema } from "@/lib/validations/organizer"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true, slug: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "USER") {
      return NextResponse.json(
        { error: "Already an organizer", slug: user.slug },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = upgradeToOrganizerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    let finalSlug: string
    if (parsed.data.slug) {
      const slugTaken = await db.user.findUnique({ where: { slug: parsed.data.slug } })
      if (slugTaken) {
        return NextResponse.json({ error: "This profile URL is already taken" }, { status: 409 })
      }
      finalSlug = parsed.data.slug
    } else {
      const base = slugify(user.name || "organizer", { lower: true, strict: true })
      finalSlug = base
      let exists = await db.user.findUnique({ where: { slug: finalSlug } })
      while (exists) {
        finalSlug = `${base}-${nanoid(4).toLowerCase()}`
        exists = await db.user.findUnique({ where: { slug: finalSlug } })
      }
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: { role: "ORGANIZER", slug: finalSlug },
      select: { slug: true, role: true },
    })

    return NextResponse.json({ slug: updated.slug, role: updated.role })
  } catch (error) {
    console.error("Upgrade to organizer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
