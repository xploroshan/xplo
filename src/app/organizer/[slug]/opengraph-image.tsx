import { ImageResponse } from "next/og"
import { db } from "@/lib/db"
import { APP_NAME } from "@/lib/constants"

// Dynamic share card for an organiser profile. Rendered server-side by next/og
// and consumed as the og:image / twitter:image when the link is pasted into
// WhatsApp, Instagram, Slack, etc. Every shared link becomes a branded ad.
export const runtime = "nodejs"
export const alt = `${APP_NAME} Organizer`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// HYKRZ brand
const ORANGE = "#f97316"
const ORANGE_DEEP = "#ef4444"
const BG = "#09090b"

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let organizer: {
    name: string | null
    image: string | null
    city: string | null
    bio: string | null
    verified: boolean
    ratingOverride: number | null
    ratingLocked: boolean
    _count: { organizedEvents: number; followers: number }
  } | null = null
  let participantCount = 0
  let avgRating: number | null = null
  let nextEvent: { title: string; startDate: Date } | null = null

  try {
    organizer = await db.user.findUnique({
      where: { slug },
      select: {
        name: true,
        image: true,
        city: true,
        bio: true,
        verified: true,
        ratingOverride: true,
        ratingLocked: true,
        _count: { select: { organizedEvents: true, followers: true } },
      },
    })

    if (organizer) {
      const [participants, ratings, upcoming] = await Promise.all([
        db.eventParticipant.count({
          where: { event: { organizer: { slug } }, status: "CONFIRMED" },
        }),
        db.eventParticipant.aggregate({
          where: { event: { organizer: { slug } }, rating: { not: null } },
          _avg: { rating: true },
        }),
        db.event.findFirst({
          where: { organizer: { slug }, status: { in: ["PUBLISHED", "OPEN", "ACTIVE"] } },
          orderBy: { startDate: "asc" },
          select: { title: true, startDate: true },
        }),
      ])
      participantCount = participants
      avgRating =
        organizer.ratingLocked && organizer.ratingOverride != null
          ? organizer.ratingOverride
          : ratings._avg.rating
      nextEvent = upcoming
    }
  } catch {
    // DB unavailable (e.g. during build) — fall through to branded default.
  }

  const name = organizer?.name ?? "Adventure Organizer"
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const avatarUrl =
    organizer?.image && /^https?:\/\//.test(organizer.image) ? organizer.image : null

  const stats: { label: string; value: string }[] = [
    { label: "Events", value: String(organizer?._count.organizedEvents ?? 0) },
    { label: "Followers", value: String(organizer?._count.followers ?? 0) },
    { label: "Riders Led", value: String(participantCount) },
    { label: "Rating", value: avgRating ? avgRating.toFixed(1) : "New" },
  ]

  const nextDate = nextEvent
    ? new Date(nextEvent.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : null

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: BG,
          padding: "56px 64px 0",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ORANGE}22 0%, transparent 70%)`,
          }}
        />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 44 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: ORANGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 900,
              color: BG,
            }}
          >
            H
          </div>
          <span
            style={{
              color: ORANGE,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {APP_NAME}
          </span>
        </div>

        {/* Identity row */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              width={148}
              height={148}
              style={{
                width: 148,
                height: 148,
                borderRadius: "50%",
                objectFit: "cover",
                border: `4px solid ${ORANGE}55`,
              }}
            />
          ) : (
            <div
              style={{
                width: 148,
                height: 148,
                borderRadius: "50%",
                background: `${ORANGE}1a`,
                border: `4px solid ${ORANGE}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                fontWeight: 800,
                color: ORANGE,
              }}
            >
              {initials}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 800 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  fontSize: name.length > 22 ? 56 : 68,
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.05,
                }}
              >
                {name}
              </span>
              {organizer?.verified && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "#3b82f6",
                    color: "#fff",
                    fontSize: 20,
                    fontWeight: 900,
                  }}
                >
                  ✓
                </span>
              )}
            </div>
            {organizer?.city && (
              <span style={{ fontSize: 28, color: "#a1a1aa", marginTop: 8 }}>
                📍 {organizer.city}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 18, marginTop: 44 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                padding: "22px 0",
                borderRadius: 18,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontSize: 44, fontWeight: 800, color: "#ffffff" }}>{s.value}</span>
              <span
                style={{
                  fontSize: 18,
                  color: "#a1a1aa",
                  marginTop: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Next event teaser */}
        {nextEvent && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 40 }}>
            <span
              style={{
                background: `${ORANGE}26`,
                color: ORANGE,
                padding: "8px 18px",
                borderRadius: 10,
                fontSize: 20,
                fontWeight: 700,
                border: `1px solid ${ORANGE}55`,
              }}
            >
              Next ride{nextDate ? ` · ${nextDate}` : ""}
            </span>
            <span
              style={{
                fontSize: 26,
                color: "#d4d4d8",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 760,
              }}
            >
              {nextEvent.title}
            </span>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 46,
            right: 64,
            display: "flex",
            alignItems: "center",
            color: "rgba(255,255,255,0.16)",
            fontSize: 15,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Join the ride on {APP_NAME}
        </div>

        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_DEEP})`,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
