import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { resetPasswordSchema } from "@/lib/validations/auth"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Rate limit: 5 requests per 15 minutes per IP
    const ip = getClientIp(request)
    const { success } = rateLimit(`reset-pwd:${ip}`, 5, 15 * 60 * 1000)
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { token, newPassword } = parsed.data

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: "This reset token has already been used" },
        { status: 400 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset token has expired" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update password and reset lockout
    await db.user.update({
      where: { email: resetToken.email },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    })

    return NextResponse.json({ message: "Password has been reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
