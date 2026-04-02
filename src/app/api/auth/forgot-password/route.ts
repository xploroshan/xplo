import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { forgotPasswordSchema } from "@/lib/validations/auth"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Rate limit: 3 requests per 15 minutes per IP
    const ip = getClientIp(request)
    const { success } = rateLimit(`forgot-pwd:${ip}`, 3, 15 * 60 * 1000)
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // Always return 200 to prevent email enumeration
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, email: true },
    })

    if (user && user.passwordHash) {
      // Delete any existing tokens for this email
      await db.passwordResetToken.deleteMany({ where: { email } })

      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.passwordResetToken.create({
        data: { token, email, expiresAt },
      })

      // In development: log the reset URL to console
      // In production: send email with reset link
      const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`
      console.log(`[Password Reset] Token for ${email}: ${resetUrl}`)
    }

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
