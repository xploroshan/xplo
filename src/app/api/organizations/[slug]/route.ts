import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sanitizeInput } from "@/lib/sanitize"
import { updateOrganizationSchema } from "@/lib/validations/organization"
import { getEffectiveRating } from "@/lib/ratings"
// getEffectiveRating(calculated, override, locked) => number | null

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const org = await db.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Total participants across all org events
    const participantStats = await db.eventParticipant.aggregate({
      where: {
        event: { organizationId: org.id },
        status: "CONFIRMED",
      },
      _count: true,
    })

    // Recent events (last 6)
    const recentEvents = await db.event.findMany({
      where: { organizationId: org.id },
      orderBy: { startDate: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        startDate: true,
        status: true,
        eventType: {
          select: { name: true, icon: true, color: true },
        },
        _count: {
          select: { participants: { where: { status: "CONFIRMED" } } },
        },
      },
    })

    const effectiveRating = getEffectiveRating(
      org.avgRating,
      org.ratingOverride,
      org.ratingLocked,
    )

    return NextResponse.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      banner: org.banner,
      description: org.description,
      website: org.website,
      socialLinks: org.socialLinks,
      city: org.city,
      verified: org.verified,
      featured: org.featured,
      status: org.status,
      createdAt: org.createdAt,
      rating: effectiveRating,
      ratingCount: org.ratingCount,
      members: org.members.map((m) => ({
        id: m.id,
        role: m.role,
        title: m.title,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      stats: {
        eventCount: org._count.events,
        totalParticipants: participantStats._count,
      },
      recentEvents,
    })
  } catch (error) {
    console.error("Get organization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params

    const org = await db.organization.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Must be org OWNER or ADMIN member
    const membership = org.members[0]
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateOrganizationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data

    // If slug is being changed, check uniqueness
    if (data.slug && data.slug !== org.slug) {
      const existingSlug = await db.organization.findUnique({
        where: { slug: data.slug },
      })
      if (existingSlug) {
        return NextResponse.json({ error: "Slug is already taken" }, { status: 409 })
      }
    }

    // Sanitize text inputs
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = sanitizeInput(data.name)
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = sanitizeInput(data.description)
    if (data.website !== undefined) updateData.website = data.website || null
    if (data.city !== undefined) updateData.city = data.city || null

    const updated = await db.organization.update({
      where: { id: org.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update organization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
