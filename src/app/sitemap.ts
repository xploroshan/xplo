import type { MetadataRoute } from "next"
import { APP_URL } from "@/lib/constants"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/events`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${APP_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]
}
