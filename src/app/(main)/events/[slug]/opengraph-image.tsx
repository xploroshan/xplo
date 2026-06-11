import { ImageResponse } from "next/og"
import { db } from "@/lib/db"
import { APP_NAME } from "@/lib/constants"

// Dynamic share card for an event. Event links are what riders share most, so
// a rich card here directly fuels the share -> register loop.
export const runtime = "nodejs"
export const alt = `${APP_NAME} Event`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const ORANGE = "#f97316"
const ORANGE_DEEP = "#ef4444"
const BG = "#09090b"

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let event: {
    title: string
    startDate: Date
    coverImage: string | null
    difficulty: string | null
    status: string
    capacity: number | null
    destination: unknown
    eventType: { name: string; color: string } | null
    organizer: { name: string | null } | null
    _count: { participants: number }
  } | null = null

  try {
    event = await db.event.findUnique({
      where: { slug },
      select: {
        title: true,
        startDate: true,
        coverImage: true,
        difficulty: true,
        status: true,
        capacity: true,
        destination: true,
        eventType: { select: { name: true, color: true } },
        organizer: { select: { name: true } },
        _count: { select: { participants: { where: { status: "CONFIRMED" } } } },
      },
    })
  } catch {
    // DB unavailable — fall through to branded default.
  }

  const accent = event?.eventType?.color ?? ORANGE
  const coverUrl =
    event?.coverImage && /^https?:\/\//.test(event.coverImage) ? event.coverImage : null

  // Cover-image variant: full-bleed photo + title overlay + brand strip.
  if (coverUrl) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", background: BG }}>
          <img src={coverUrl} alt={event!.title} width={1200} height={630} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "56px 64px",
              background: "linear-gradient(180deg, rgba(9,9,11,0) 35%, rgba(9,9,11,0.92) 100%)",
            }}
          >
            <span style={{ color: ORANGE, fontSize: 18, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>
              {APP_NAME}
            </span>
            <span style={{ fontSize: 60, fontWeight: 800, color: "#fff", lineHeight: 1.05, maxWidth: 1000 }}>{event!.title}</span>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_DEEP})` }} />
        </div>
      ),
      { ...size }
    )
  }

  const title = event?.title ?? "Adventure Ride"
  const dateStr = event
    ? new Date(event.startDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })
    : null
  const destinationAddress =
    event && event.destination && typeof event.destination === "object"
      ? (event.destination as { address?: string }).address ?? null
      : null
  const confirmed = event?._count.participants ?? 0
  const spotsLeft = event?.capacity != null ? Math.max(event.capacity - confirmed, 0) : null

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
        <div style={{ position: "absolute", top: -140, right: -120, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(circle, ${accent}26 0%, transparent 70%)` }} />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: BG }}>H</div>
          <span style={{ color: ORANGE, fontSize: 18, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase" }}>{APP_NAME}</span>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          {event?.eventType && (
            <span style={{ background: `${accent}26`, color: accent, padding: "7px 16px", borderRadius: 10, fontSize: 18, fontWeight: 700, border: `1px solid ${accent}55` }}>
              {event.eventType.name}
            </span>
          )}
          {event?.difficulty && (
            <span style={{ background: "rgba(255,255,255,0.06)", color: "#d4d4d8", padding: "7px 16px", borderRadius: 10, fontSize: 18, textTransform: "capitalize" }}>
              {event.difficulty}
            </span>
          )}
          {event?.status === "OPEN" && (
            <span style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "7px 16px", borderRadius: 10, fontSize: 18, border: "1px solid rgba(34,197,94,0.35)" }}>
              Open for Registration
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: title.length > 38 ? 52 : 62, fontWeight: 800, color: "#fff", lineHeight: 1.08, marginBottom: 26, maxWidth: 1020 }}>{title}</div>

        {/* Meta row */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {dateStr && <span style={{ fontSize: 28, color: "#d4d4d8" }}>📅 {dateStr}</span>}
          {destinationAddress && (
            <span style={{ fontSize: 28, color: "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 1020 }}>📍 {destinationAddress}</span>
          )}
        </div>

        {/* Footer: organiser + spots */}
        <div style={{ position: "absolute", bottom: 46, left: 64, right: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {event?.organizer?.name && (
            <span style={{ fontSize: 22, color: "#a1a1aa" }}>Led by <span style={{ color: "#fff", fontWeight: 600 }}>{event.organizer.name}</span></span>
          )}
          {spotsLeft != null && (
            <span style={{ fontSize: 22, color: spotsLeft === 0 ? "#f87171" : accent, fontWeight: 700 }}>
              {spotsLeft === 0 ? "Fully booked" : `${spotsLeft} spots left`}
            </span>
          )}
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_DEEP})` }} />
      </div>
    ),
    { ...size }
  )
}
