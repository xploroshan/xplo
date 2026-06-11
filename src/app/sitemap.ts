import type { MetadataRoute } from "next"
import { APP_URL } from "@/lib/constants"
import { db } from "@/lib/db"

// Generated at request time (not build) so it never couples the build to the DB.
export const dynamic = "force-dynamic"

// Dynamic sitemap: real events + organizer profiles + categories, so the
// content that actually drives search traffic is discoverable (was static).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/events`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP_URL}/organizations`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${APP_URL}/feed`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.6 },
    { url: `${APP_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  // Never let a DB hiccup break the sitemap — fall back to static routes.
  let events: { slug: string; updatedAt: Date }[] = []
  let organizers: { slug: string | null; updatedAt: Date }[] = []
  let types: { slug: string }[] = []
  try {
    ;[events, organizers, types] = await Promise.all([
      db.event.findMany({
        where: { status: { in: ["PUBLISHED", "OPEN", "ACTIVE", "COMPLETED"] } },
        orderBy: { startDate: "desc" },
        take: 5000,
        select: { slug: true, updatedAt: true },
      }),
      db.user.findMany({
        where: { role: { in: ["ORGANIZER", "ADMIN", "SUPER_ADMIN"] }, slug: { not: null } },
        take: 2000,
        select: { slug: true, updatedAt: true },
      }),
      db.eventType.findMany({ where: { isActive: true }, select: { slug: true } }),
    ])
  } catch {
    return staticRoutes
  }

  return [
    ...staticRoutes,
    ...types.map((t) => ({
      url: `${APP_URL}/events?type=${t.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: `${APP_URL}/events/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...organizers.map((o) => ({
      url: `${APP_URL}/@${o.slug}`,
      lastModified: o.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}
