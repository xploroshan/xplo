import { notFound } from "next/navigation"
import Link from "next/link"
import QRCode from "qrcode"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { buildPassPayload, passCodeFor } from "@/lib/pass"
import { Badge } from "@/components/ui/badge"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata = { title: "Your pass — HYKRZ" }

// The participant's e-pass: a QR the organizer scans (or a short code they
// read out) at the assembly point. Only the confirmed rider can see their own.
export default async function EventPassPage({ params }: PageProps) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const event = await db.event.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, startDate: true, startLocation: true },
  })
  if (!event) notFound()

  const participant = await db.eventParticipant.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
    select: { id: true, status: true, checkedInAt: true },
  })
  if (!participant || participant.status !== "CONFIRMED") notFound()

  const payload = buildPassPayload(event.id, participant.id)
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 320,
    margin: 2,
    color: { dark: "#09090b", light: "#ffffff" },
  })
  const code = passCodeFor(participant.id)

  const when = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(event.startDate)

  const startAddress =
    event.startLocation && typeof event.startLocation === "object"
      ? ((event.startLocation as { address?: string }).address ?? null)
      : null

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Link
        href={`/events/${event.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to event
      </Link>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-100">
            HYKRZ e-pass
          </p>
          <h1 className="text-xl font-bold text-white mt-0.5">{event.title}</h1>
          <p className="text-sm text-orange-100 mt-1">{when}</p>
          {startAddress && <p className="text-xs text-orange-200 mt-0.5">Assembly: {startAddress}</p>}
        </div>

        <div className="p-6 flex flex-col items-center">
          {participant.checkedInAt ? (
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-0 gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Checked in
            </Badge>
          ) : (
            <p className="text-xs text-zinc-500 mb-4">
              Show this to your organizer at the assembly point
            </p>
          )}

          <div className="rounded-2xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Your check-in QR code" width={280} height={280} />
          </div>

          <p className="mt-4 text-xs text-zinc-500">Or read out this code</p>
          <p className="text-2xl font-mono font-bold tracking-[0.2em] text-white mt-1">{code}</p>
          <p className="mt-3 text-xs text-zinc-600">{session.user.name}</p>
        </div>
      </div>
    </div>
  )
}
