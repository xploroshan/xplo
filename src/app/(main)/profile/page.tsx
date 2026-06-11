import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { MapPin, Calendar, Users, CalendarCheck, CheckCircle2 } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { OrganizerCta } from "@/components/profile/organizer-cta"
import { ChangePassword } from "@/components/profile/change-password"
import { EditProfile } from "@/components/profile/edit-profile"
import { EmailVerification } from "@/components/profile/email-verification"
import { TwoFactor } from "@/components/profile/two-factor"

export const metadata = { title: "Your profile — HYKRZ" }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/profile")

  const userId = session.user.id
  const now = new Date()

  const [user, going, organizing, following, upcoming] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        name: true, email: true, image: true, bio: true, city: true, interests: true,
        emailVerified: true, twoFactorEnabled: true, role: true, createdAt: true,
      },
    }),
    db.eventParticipant.count({ where: { userId, status: "CONFIRMED" } }),
    db.event.count({ where: { organizerId: userId } }),
    db.follow.count({ where: { followerId: userId } }),
    db.eventParticipant.findMany({
      where: { userId, status: { not: "CANCELLED" }, event: { startDate: { gte: now } } },
      orderBy: { event: { startDate: "asc" } },
      take: 5,
      select: {
        status: true,
        event: { select: { slug: true, title: true, startDate: true, eventType: { select: { name: true, color: true } } } },
      },
    }),
  ])
  if (!user) redirect("/login")

  const name = user.name || "HYKRZ User"
  const initials = name.charAt(0).toUpperCase()
  const memberSince = user.createdAt.getFullYear()
  const isOrganizer = ["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(user.role)

  const stats = [
    { label: "Going", value: going, icon: CalendarCheck },
    { label: "Organizing", value: organizing, icon: Calendar },
    { label: "Following", value: following, icon: Users },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden border border-zinc-800/50">
        <div className="h-28 sm:h-36 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent" />
        <div className="relative px-5 pb-5">
          <Avatar className="h-20 w-20 -mt-10 border-4 border-zinc-950 shadow-xl">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{name}</h1>
              {user.emailVerified && <CheckCircle2 className="h-4 w-4 text-green-400" />}
              {isOrganizer && (
                <Badge className="bg-orange-500/15 text-orange-400 border-0 text-[10px]">Organizer</Badge>
              )}
            </div>
            <p className="text-sm text-zinc-400">{user.email}</p>
            {user.bio && <p className="text-sm text-zinc-300 mt-2 max-w-lg">{user.bio}</p>}
            <div className="flex items-center gap-3 mt-2 text-sm text-zinc-500">
              {user.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Member since {memberSince}
              </span>
            </div>
            {user.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.interests.map((it) => (
                  <span key={it} className="rounded-full bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-300">
                    {it}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {stats.map((s) => (
              <div key={s.label} className="text-center py-3 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                <s.icon className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming rides */}
      {upcoming.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Your upcoming rides</h2>
          <div className="space-y-2">
            {upcoming.map((p) => (
              <Link
                key={p.event.slug}
                href={`/events/${p.event.slug}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-zinc-800/50 transition-colors"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.event.eventType?.color || "#f97316" }}
                />
                <span className="text-sm text-white flex-1 truncate">{p.event.title}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(p.event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <Badge className="bg-zinc-800 text-zinc-400 border-0 text-[10px]">{p.status.toLowerCase()}</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Security & settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Account & security</h2>
        <Suspense fallback={null}>
          <EmailVerification verified={!!user.emailVerified} />
        </Suspense>
        <EditProfile
          initial={{
            name: user.name || "",
            bio: user.bio || "",
            city: user.city || "",
            image: user.image,
            interests: user.interests,
          }}
        />
        <TwoFactor enabled={user.twoFactorEnabled} />
        <ChangePassword />
        {!isOrganizer && <OrganizerCta />}
      </div>
    </div>
  )
}
