import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const body = z.object({
  banned: z.boolean().optional(),
  verified: z.boolean().optional(),
  role: z.enum(["USER", "ORGANIZER", "ADMIN", "SUPER_ADMIN"]).optional(),
})

// Admin moderation of a user (ban, verify, role). Guards against privilege
// escalation: you can't act on yourself, and only a SUPER_ADMIN may touch
// another admin or grant admin roles.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  const myRole = session?.user?.role
  if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(myRole ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { userId } = await params
  if (userId === session.user.id) {
    return NextResponse.json({ error: "You can't moderate your own account" }, { status: 400 })
  }

  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  const d = parsed.data

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const isSuper = myRole === "SUPER_ADMIN"
  // Only a super admin can modify other admins or hand out admin roles.
  if (!isSuper && (["ADMIN", "SUPER_ADMIN"].includes(target.role) ||
    (d.role && ["ADMIN", "SUPER_ADMIN"].includes(d.role)))) {
    return NextResponse.json({ error: "Only a super admin can do that" }, { status: 403 })
  }

  await db.user.update({
    where: { id: userId },
    data: {
      ...(d.banned !== undefined ? { banned: d.banned } : {}),
      ...(d.verified !== undefined ? { verified: d.verified } : {}),
      ...(d.role !== undefined ? { role: d.role } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}
