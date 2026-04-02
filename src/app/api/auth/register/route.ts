import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import slugify from "slugify"
import { nanoid } from "nanoid"
import { db } from "@/lib/db"
import { registerSchema } from "@/lib/validations/auth"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { sanitizeInput } from "@/lib/sanitize"

async function generateUniqueSlug(baseName: string): Promise<string> {
  const base = slugify(baseName, { lower: true, strict: true })
  let slug = base
  let exists = await db.user.findUnique({ where: { slug } })
  while (exists) {
    slug = `${base}-${nanoid(4).toLowerCase()}`
    exists = await db.user.findUnique({ where: { slug } })
  }
  return slug
}

export async function POST(request: Request) {
  try {
    // Rate limit: 5 requests per 15 minutes per IP
    const ip = getClientIp(request)
    const { success: allowed } = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { email, password, city, role, slug } = parsed.data
    const name = sanitizeInput(parsed.data.name)

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // For organizers, validate slug uniqueness or auto-generate
    let finalSlug: string | undefined
    if (role === "ORGANIZER") {
      if (slug) {
        const slugTaken = await db.user.findUnique({ where: { slug } })
        if (slugTaken) {
          return NextResponse.json(
            { error: "This profile URL is already taken" },
            { status: 409 }
          )
        }
        finalSlug = slug
      } else {
        finalSlug = await generateUniqueSlug(name)
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        city,
        role: role ?? "USER",
        slug: finalSlug,
      },
    })

    return NextResponse.json(
      { message: "Account created successfully", slug: user.slug },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
