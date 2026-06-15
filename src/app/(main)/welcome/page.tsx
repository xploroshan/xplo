import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { WelcomeFlow } from "@/components/onboarding/welcome-flow"

// First-run onboarding: capture city + interests and let new users follow a few
// organizers so /events recommendations and the feed aren't empty on day one.
export default async function WelcomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/welcome")

  const [me, organizers] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { city: true, interests: true, emailVerified: true },
    }),
    db.user.findMany({
      where: { role: { in: ["ORGANIZER", "ADMIN", "SUPER_ADMIN"] }, slug: { not: null } },
      orderBy: { followers: { _count: "desc" } },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        verified: true,
        city: true,
        _count: { select: { followers: true, organizedEvents: true } },
      },
    }),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <WelcomeFlow
        initialCity={me?.city ?? ""}
        initialInterests={me?.interests ?? []}
        emailVerified={!!me?.emailVerified}
        organizers={organizers.map((o) => ({
          id: o.id,
          name: o.name || "Organizer",
          slug: o.slug || "",
          image: o.image,
          verified: o.verified,
          city: o.city,
          followers: o._count.followers,
          events: o._count.organizedEvents,
        }))}
      />
    </div>
  )
}
