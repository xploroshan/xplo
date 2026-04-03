import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizeInput } from "@/lib/sanitize"
import { createOrganizationSchema } from "@/lib/validations/organization"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check role: must be ORGANIZER+
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Rate limit: 5 per hour
    const { success } = rateLimit(`create-org:${session.user.id}`, 5, 60 * 60 * 1000)
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
    }

    const body = await request.json()
    const parsed = createOrganizationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data

    // Check slug uniqueness
    const existingSlug = await db.organization.findUnique({
      where: { slug: data.slug },
    })
    if (existingSlug) {
      return NextResponse.json({ error: "Slug is already taken" }, { status: 409 })
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(data.name)
    const sanitizedDescription = data.description ? sanitizeInput(data.description) : undefined

    // Create org + add creator as OWNER in a transaction
    const organization = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: sanitizedName,
          slug: data.slug,
          description: sanitizedDescription,
          website: data.website || null,
          city: data.city || null,
          status: "PENDING",
        },
      })

      await tx.organizationMember.create({
        data: {
          userId: session.user.id,
          organizationId: org.id,
          role: "OWNER",
        },
      })

      return org
    })

    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error("Create organization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "ACTIVE"
    const featured = searchParams.get("featured")
    const search = searchParams.get("search")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      status: status as "PENDING" | "ACTIVE" | "SUSPENDED",
    }

    if (featured === "true") {
      where.featured = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ]
    }

    const [organizations, total] = await Promise.all([
      db.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          description: true,
          city: true,
          verified: true,
          featured: true,
          avgRating: true,
          ratingCount: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              events: true,
            },
          },
        },
      }),
      db.organization.count({ where }),
    ])

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("List organizations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
