import { NextResponse } from "next/server"
import slugify from "slugify"
import { nanoid } from "nanoid"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { track } from "@/lib/analytics"

// Body sent by the create-event form. Event type comes through as a slug
// (the radio value), resolved to an id here.
const createEventBody = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(5000).optional(),
  eventTypeSlug: z.string().min(1, "Event type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  startLocationAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
})

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base, { lower: true, strict: true }).slice(0, 60) || "event"
  // Fast path — try the clean slug first, then fall back to a suffix.
  if (!(await db.event.findUnique({ where: { slug: root }, select: { id: true } }))) {
    return root
  }
  return `${root}-${nanoid(6).toLowerCase()}`
}

async function uniqueUserSlug(base: string): Promise<string> {
  const root = slugify(base, { lower: true, strict: true }).slice(0, 40) || "organizer"
  if (!(await db.user.findUnique({ where: { slug: root }, select: { id: true } }))) {
    return root
  }
  return `${root}-${nanoid(4).toLowerCase()}`
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json().catch(() => null)
    const parsed = createEventBody.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      )
    }
    const data = parsed.data

    const eventType = await db.eventType.findUnique({
      where: { slug: data.eventTypeSlug },
      select: { id: true },
    })
    if (!eventType) {
      return NextResponse.json({ error: "Unknown event type" }, { status: 400 })
    }

    // Auto-claim an organiser handle on first publish: give the user a slug and
    // upgrade USER -> ORGANIZER so /@slug works and the event has a public home.
    const me = await db.user.findUnique({
      where: { id: session.user.id },
      select: { slug: true, role: true, name: true },
    })
    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let organizerSlug = me.slug
    if (!organizerSlug) {
      organizerSlug = await uniqueUserSlug(me.name || "organizer")
      await db.user.update({
        where: { id: session.user.id },
        data: {
          slug: organizerSlug,
          role: me.role === "USER" ? "ORGANIZER" : me.role,
        },
      })
    } else if (me.role === "USER") {
      await db.user.update({ where: { id: session.user.id }, data: { role: "ORGANIZER" } })
    }

    const slug = await uniqueSlug(data.title)

    const event = await db.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        eventTypeId: eventType.id,
        organizerId: session.user.id,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        startLocation: data.startLocationAddress
          ? { address: data.startLocationAddress }
          : undefined,
        destination: data.destinationAddress
          ? { address: data.destinationAddress }
          : undefined,
        capacity: data.capacity,
        price: data.price,
        // Publish straight to OPEN so it's immediately shareable and joinable.
        status: "OPEN",
      },
      select: { id: true, slug: true },
    })

    // Activation: first/next publish. handleClaimed flags the supply-side moment.
    await track("event_published", {
      userId: session.user.id,
      eventId: event.id,
      organizerId: session.user.id,
      props: { handleClaimed: !me.slug },
    })

    // Close the come-back loop: notify everyone who follows this organiser, so a
    // follow actually pulls riders back when a new ride drops.
    const followers = await db.follow.findMany({
      where: { followingId: session.user.id },
      select: { followerId: true },
    })
    if (followers.length > 0) {
      await db.notification.createMany({
        data: followers.map((f) => ({
          type: "EVENT_INVITE" as const,
          title: "New ride published",
          content: `${me.name || "An organiser you follow"} just published "${data.title}"`,
          link: `/events/${event.slug}`,
          userId: f.followerId,
          senderId: session.user!.id,
        })),
      })
    }

    return NextResponse.json({ event: { slug: event.slug }, organizerSlug }, { status: 201 })
  } catch (error) {
    console.error("Event create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
