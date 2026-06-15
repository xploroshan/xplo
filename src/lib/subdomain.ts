// Pure, edge-safe subdomain helpers (NO Prisma/db imports) — used by middleware.

/**
 * Subdomain labels that must never resolve to a tenant microsite — they belong
 * to the platform itself or are reserved for infra.
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "mail", "smtp", "ftp", "static", "assets",
  "cdn", "img", "images", "blog", "help", "support", "status", "docs",
  "hykrz", "dashboard", "auth", "login", "account", "billing", "vercel",
])

/** The root domain the platform serves from (no protocol). */
export function rootDomain(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").host
  } catch {
    return "localhost:3000"
  }
}

/**
 * Extract a tenant subdomain label from a Host header, or null when the host is
 * the apex/app domain (or a reserved label). Handles `localhost` / `*.localhost`
 * for dev and `<label>.<root>` in prod. Strips the port.
 */
export function subdomainFromHost(host: string | null | undefined): string | null {
  if (!host) return null
  const hostname = host.split(":")[0].toLowerCase()
  if (!hostname || hostname === "localhost") return null

  let label: string | null = null
  if (hostname.endsWith(".localhost")) {
    label = hostname.slice(0, -".localhost".length).split(".")[0] || null
  } else {
    const root = rootDomain().split(":")[0].toLowerCase()
    if (hostname === root) return null
    if (root && hostname.endsWith("." + root)) {
      label = hostname.slice(0, hostname.length - root.length - 1).split(".")[0] || null
    }
  }

  if (!label || RESERVED_SUBDOMAINS.has(label)) return null
  return label
}

/** Validation for a user-claimed subdomain label (2–40 chars, no edge hyphens). */
export function isValidSubdomain(label: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(label) && !RESERVED_SUBDOMAINS.has(label)
}
