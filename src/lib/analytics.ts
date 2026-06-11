import { db } from "@/lib/db"

// The wedge loop, instrumented end-to-end. Keep this list tight — it IS the
// funnel we use to decide whether the loop works before adding payments.
export type AnalyticsName =
  | "event_published"
  | "event_viewed"
  | "event_registered"
  | "organizer_viewed"
  | "organizer_followed"
  | "share_clicked"
  | "link_copied"
  | "participant_checked_in"

export const ANALYTICS_NAMES: readonly AnalyticsName[] = [
  "event_published",
  "event_viewed",
  "event_registered",
  "organizer_viewed",
  "organizer_followed",
  "share_clicked",
  "link_copied",
  "participant_checked_in",
]

interface TrackData {
  userId?: string | null
  eventId?: string | null
  organizerId?: string | null
  props?: Record<string, unknown>
}

/**
 * Record a product-analytics event. Fire-and-forget — never throws, so a
 * tracking failure can never break a user action. The same call site can
 * later fan out to PostHog without touching instrumentation.
 */
export async function track(name: AnalyticsName, data: TrackData = {}): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        name,
        userId: data.userId ?? undefined,
        eventId: data.eventId ?? undefined,
        organizerId: data.organizerId ?? undefined,
        props: (data.props as object) ?? undefined,
      },
    })
  } catch {
    // Analytics must never be load-bearing.
  }
}

export interface FunnelStats {
  totals: Record<AnalyticsName, number>
  conversion: {
    viewToRegister: number | null // registers / event views
    registerToFollow: number | null // follows / registers
  }
  recent: {
    id: string
    name: string
    createdAt: Date
    eventId: string | null
    organizerId: string | null
  }[]
}

export async function getFunnelStats(): Promise<FunnelStats> {
  const [grouped, recent] = await Promise.all([
    db.analyticsEvent.groupBy({ by: ["name"], _count: { _all: true } }),
    db.analyticsEvent.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true, eventId: true, organizerId: true },
    }),
  ])

  const totals = Object.fromEntries(ANALYTICS_NAMES.map((n) => [n, 0])) as Record<
    AnalyticsName,
    number
  >
  for (const row of grouped) {
    if ((ANALYTICS_NAMES as readonly string[]).includes(row.name)) {
      totals[row.name as AnalyticsName] = row._count._all
    }
  }

  const rate = (num: number, den: number) => (den > 0 ? num / den : null)

  return {
    totals,
    conversion: {
      viewToRegister: rate(totals.event_registered, totals.event_viewed),
      registerToFollow: rate(totals.organizer_followed, totals.event_registered),
    },
    recent,
  }
}
