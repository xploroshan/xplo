import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { addMemberSchema } from "@/lib/validations/organization"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const org = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const members = await db.organizationMember.findMany({
      where: { organizationId: org.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            slug: true,
            email: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    })

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        title: m.title,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    })
  } catch (error) {
    console.error("List organization members error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
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

    // Must be org OWNER or ADMIN
    const membership = org.members[0]
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = addMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 })
    }

    const { userId, role, title } = parsed.data

    // Validate target user exists and has ORGANIZER+ role
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(targetUser.role)) {
      return NextResponse.json({ error: "User must have ORGANIZER or higher role" }, { status: 400 })
    }

    // Check for duplicate membership
    const existingMembership = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: org.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: "User is already a member of this organization" }, { status: 409 })
    }

    const member = await db.organizationMember.create({
      data: {
        userId,
        organizationId: org.id,
        role,
        title: title || null,
      },
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
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error("Add organization member error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
