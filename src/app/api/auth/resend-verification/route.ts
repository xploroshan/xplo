import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sendVerificationEmail } from "@/lib/verification"

// Re-send the verification email to the signed-in user.
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { success } = await rateLimit(`resend-verify:${session.user.id}`, 3, 15 * 60 * 1000)
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  })
  if (!user?.email) {
    return NextResponse.json({ error: "No email on file" }, { status: 400 })
  }
  if (user.emailVerified) {
    return NextResponse.json({ message: "Already verified" })
  }

  await sendVerificationEmail(session.user.id, user.email)
  return NextResponse.json({ message: "Verification email sent" })
}
