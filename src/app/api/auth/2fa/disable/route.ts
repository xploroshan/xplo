import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { verifyTotp } from "@/lib/totp"

const body = z.object({ code: z.string().min(6).max(8) })

// Turn off 2FA — requires a current valid code so a hijacked session can't
// silently disable it.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "A 6-digit code is required" }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  })
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 })
  }
  if (!verifyTotp(parsed.data.code, user.twoFactorSecret)) {
    return NextResponse.json({ error: "That code didn't match." }, { status: 400 })
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  })
  return NextResponse.json({ enabled: false })
}
