import crypto from "crypto"
import { db } from "@/lib/db"
import { sendEmail, verifyEmailEmail, appUrl } from "@/lib/email"

// Create a fresh email-verification token and send the link. Best-effort: the
// email no-ops if Resend isn't configured, so this never blocks registration.
export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  await db.emailVerificationToken.deleteMany({ where: { userId } })
  const token = crypto.randomBytes(32).toString("hex")
  await db.emailVerificationToken.create({
    data: { token, userId, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  })
  const url = `${appUrl()}/api/auth/verify-email?token=${token}`
  const { subject, html, text } = verifyEmailEmail(url)
  await sendEmail({ to: email, subject, html, text })
}
