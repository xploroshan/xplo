import { NextResponse } from "next/server"
import QRCode from "qrcode"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateTotpSecret, totpAuthUri } from "@/lib/totp"

// Begin 2FA enrollment: generate + store a secret (not yet enabled) and return
// the QR + secret for the user's authenticator app.
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, twoFactorEnabled: true },
  })
  if (user?.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 })
  }

  const secret = generateTotpSecret()
  await db.user.update({ where: { id: session.user.id }, data: { twoFactorSecret: secret } })

  const uri = totpAuthUri(secret, user?.email || session.user.id)
  const qr = await QRCode.toDataURL(uri, { width: 240, margin: 1 })

  return NextResponse.json({ secret, qr })
}
