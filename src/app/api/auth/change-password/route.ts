import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { changePasswordSchema } from "@/lib/validations/auth"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit: 5 requests per 15 minutes per user
    const { success } = rateLimit(`change-pwd:${session.user.id}`, 5, 15 * 60 * 1000)
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = parsed.data

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Password change is not available for OAuth accounts" },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
