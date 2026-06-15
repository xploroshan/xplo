import { db } from "@/lib/db"
import { isValidSubdomain } from "@/lib/subdomain"

export { RESERVED_SUBDOMAINS, rootDomain, subdomainFromHost, isValidSubdomain } from "@/lib/subdomain"

/**
 * Is a subdomain label free to claim? Checks the reserved list + format, then
 * both tenant tables. `exclude` lets a tenant keep its own current label.
 */
export async function subdomainAvailable(
  label: string,
  exclude?: { orgId?: string; userId?: string }
): Promise<boolean> {
  if (!isValidSubdomain(label)) return false
  const [org, user] = await Promise.all([
    db.organization.findUnique({ where: { subdomain: label }, select: { id: true } }),
    db.user.findUnique({ where: { subdomain: label }, select: { id: true } }),
  ])
  if (org && org.id !== exclude?.orgId) return false
  if (user && user.id !== exclude?.userId) return false
  return true
}

export type Tenant = {
  kind: "org" | "user"
  id: string
  name: string
  slug: string
  subdomain: string
  logo: string | null
  banner: string | null
  themeColor: string | null
  tagline: string | null
  description: string | null
  socialLinks: unknown
  verified: boolean
}

/**
 * Resolve a subdomain label to its owning tenant — an Organization first, then
 * an individual organizer (User). Returns null if unclaimed.
 */
export async function resolveTenant(label: string): Promise<Tenant | null> {
  const org = await db.organization.findUnique({
    where: { subdomain: label },
    select: {
      id: true, name: true, slug: true, subdomain: true, logo: true, banner: true,
      themeColor: true, tagline: true, description: true, socialLinks: true, verified: true,
    },
  })
  if (org?.subdomain) {
    return { kind: "org", ...org, subdomain: org.subdomain }
  }

  const user = await db.user.findUnique({
    where: { subdomain: label },
    select: {
      id: true, name: true, slug: true, subdomain: true, image: true, bio: true,
      themeColor: true, tagline: true, socialLinks: true, verified: true,
    },
  })
  if (user?.subdomain) {
    return {
      kind: "user",
      id: user.id,
      name: user.name ?? user.slug ?? "Organizer",
      slug: user.slug ?? "",
      subdomain: user.subdomain,
      logo: user.image,
      banner: null,
      themeColor: user.themeColor,
      tagline: user.tagline,
      description: user.bio,
      socialLinks: user.socialLinks,
      verified: user.verified,
    }
  }
  return null
}

/** Scope a tenant-owned content query (blogs/guidelines) by owner. */
export function tenantContentWhere(tenant: Tenant): { organizationId: string } | { userId: string } {
  return tenant.kind === "org" ? { organizationId: tenant.id } : { userId: tenant.id }
}

/**
 * Can this signed-in user manage the tenant's content? Platform admins always;
 * the individual organizer for their own site; org OWNER/ADMIN members for an org.
 */
export async function tenantOwnerAccess(
  tenant: Tenant,
  userId: string | undefined | null,
  role?: string | null
): Promise<boolean> {
  if (!userId) return false
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true
  if (tenant.kind === "user") return tenant.id === userId
  const membership = await db.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: tenant.id } },
    select: { role: true },
  })
  return !!membership && ["OWNER", "ADMIN"].includes(membership.role)
}
