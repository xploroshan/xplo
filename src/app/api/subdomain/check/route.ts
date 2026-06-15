import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { subdomainAvailable, isValidSubdomain } from "@/lib/tenant"

// Live availability check for the subdomain-claim UI.
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const value = (new URL(request.url).searchParams.get("value") || "").toLowerCase().trim()
  if (!value) return NextResponse.json({ available: false, reason: "empty" })
  if (!isValidSubdomain(value)) {
    return NextResponse.json({ available: false, reason: "invalid" })
  }
  const available = await subdomainAvailable(value)
  return NextResponse.json({ available, reason: available ? "ok" : "taken" })
}
