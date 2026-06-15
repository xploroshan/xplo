import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { verifyTotp } from "@/lib/totp"

// Share the session across every `*.hykrz.com` microsite subdomain by scoping
// the cookie to the parent domain. Derived from NEXT_PUBLIC_APP_URL so it's a
// no-op locally (host-only cookie) where wildcard cookies aren't needed.
function cookieDomain(): string | undefined {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_APP_URL || "").hostname
    // Only set a parent-domain cookie for real registrable domains (not
    // localhost / IPs), so all subdomains share the login.
    if (host && host.includes(".") && !/^[\d.]+$/.test(host)) return "." + host
  } catch {
    /* ignore */
  }
  return undefined
}

const COOKIE_DOMAIN = cookieDomain()
const USE_SECURE = (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https://")

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: COOKIE_DOMAIN
    ? {
        sessionToken: {
          name: `${USE_SECURE ? "__Secure-" : ""}authjs.session-token`,
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: USE_SECURE,
            domain: COOKIE_DOMAIN,
          },
        },
      }
    : undefined,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) return null
        if (user.banned) return null

        // Check account lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          // Increment failed attempts
          const attempts = user.failedLoginAttempts + 1
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil: attempts >= 5
                ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes
                : undefined,
            },
          })
          return null
        }

        // Second factor: if 2FA is on, a valid TOTP code is required.
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const code = (credentials.code as string | undefined)?.trim()
          if (!code || !verifyTotp(code, user.twoFactorSecret)) {
            return null
          }
        }

        // Reset failed attempts on successful login
        if (user.failedLoginAttempts > 0) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          })
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? "USER"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // Fetch latest role from DB to stay in sync
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        session.user.role = dbUser?.role ?? (token.role as string) ?? "USER"
      }
      return session
    },
  },
})
