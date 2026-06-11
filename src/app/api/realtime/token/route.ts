import { NextResponse } from "next/server"
import Ably from "ably"
import { auth } from "@/lib/auth"

// Issues a short-lived Ably token to the browser (so the API key never leaves
// the server). clientId = user id powers presence identity.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json({ error: "Realtime not configured" }, { status: 503 })
  }

  const rest = new Ably.Rest(process.env.ABLY_API_KEY)
  const tokenRequest = await rest.auth.createTokenRequest({ clientId: session.user.id })
  return NextResponse.json(tokenRequest)
}
