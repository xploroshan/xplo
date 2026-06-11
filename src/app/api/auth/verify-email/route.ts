import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { appUrl } from "@/lib/email"

// Confirm an email-verification token and mark the user verified, then bounce
// to the profile with a status flag.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")
  const base = appUrl()
  if (!token) {
    return NextResponse.redirect(`${base}/profile?verified=invalid`)
  }

  const record = await db.emailVerificationToken.findUnique({ where: { token } })
  if (!record || record.expiresAt < new Date()) {
    if (record) await db.emailVerificationToken.delete({ where: { id: record.id } }).catch(() => null)
    return NextResponse.redirect(`${base}/profile?verified=expired`)
  }

  await db.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  })
  await db.emailVerificationToken.deleteMany({ where: { userId: record.userId } })

  return NextResponse.redirect(`${base}/profile?verified=success`)
}
