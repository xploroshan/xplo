import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { subdomainFromHost } from "@/lib/subdomain"

const protectedRoutes = ["/events/create", "/messages", "/profile", "/feed"]
const adminRoutes = ["/admin"]
const authRoutes = ["/login", "/register"]

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-DNS-Prefetch-Control", "on")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), interest-cohort=()"
  )
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  )
  return response
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Tenant microsites: `<label>.hykrz.com/<path>` → render `/s/<label>/<path>`.
  // Pure string rewrite (tenant resolution + 404 happens in s/[tenant]/layout).
  // Skip API and already-rewritten paths so they hit the real handlers.
  const label = subdomainFromHost(request.headers.get("host"))
  if (label && !pathname.startsWith("/s/") && !pathname.startsWith("/api")) {
    const url = request.nextUrl.clone()
    url.pathname = `/s/${label}${pathname === "/" ? "" : pathname}`
    return withSecurityHeaders(NextResponse.rewrite(url))
  }

  const response = withSecurityHeaders(NextResponse.next())

  // Check authentication via session token cookie
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  const isAuthenticated = !!sessionToken

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/events", request.url))
  }

  // Protect authenticated routes
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes require admin check (basic cookie-level check, full check in page)
  if (adminRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
  ],
}
