import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug, userId } = await params

    const org = await db.organization.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: { in: [session.user.id, userId] } },
        },
      },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Must be OWNER only
    const callerMembership = org.members.find((m) => m.userId === session.user.id)
    if (!callerMembership || callerMembership.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden. Only the org owner can change member roles." }, { status: 403 })
    }

    // Cannot change own role
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
    }

    const targetMembership = org.members.find((m) => m.userId === userId)
    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const body = await request.json()
    const { role, title } = body

    if (!role || !["ADMIN", "EVENT_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Role must be ADMIN or EVENT_MANAGER" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { role }
    if (title !== undefined) updateData.title = title || null

    const updated = await db.organizationMember.update({
      where: { id: targetMembership.id },
      data: updateData,
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update organization member error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug, userId } = await params

    const org = await db.organization.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: { in: [session.user.id, userId] } },
        },
      },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const callerMembership = org.members.find((m) => m.userId === session.user.id)
    if (!callerMembership || !["OWNER", "ADMIN"].includes(callerMembership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const targetMembership = org.members.find((m) => m.userId === userId)
    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Cannot remove OWNER
    if (targetMembership.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove the organization owner" }, { status: 400 })
    }

    // ADMIN can only remove EVENT_MANAGER
    if (callerMembership.role === "ADMIN" && targetMembership.role !== "EVENT_MANAGER") {
      return NextResponse.json({ error: "Admins can only remove event managers" }, { status: 403 })
    }

    await db.organizationMember.delete({
      where: { id: targetMembership.id },
    })

    return NextResponse.json({ message: "Member removed" })
  } catch (error) {
    console.error("Remove organization member error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
