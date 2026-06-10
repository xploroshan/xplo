import { PrismaClient, type EventStatus } from "@prisma/client"
import { MOCK_EVENTS, MOCK_ORGANIZERS } from "../src/lib/mock-data"
import { DEFAULT_EVENT_TYPES } from "../src/lib/constants"

const prisma = new PrismaClient()

async function main() {
  // Super admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "roshan.manuel@gmail.com" },
    update: { role: "SUPER_ADMIN" },
    create: { email: "roshan.manuel@gmail.com", name: "Roshan Manuel", role: "SUPER_ADMIN" },
  })
  console.log(`Super Admin: ${superAdmin.email}`)

  // Event types (from DEFAULT_EVENT_TYPES)
  const typeBySlug = new Map<string, string>()
  for (const [i, t] of DEFAULT_EVENT_TYPES.entries()) {
    const et = await prisma.eventType.upsert({
      where: { slug: t.slug },
      update: { name: t.name, icon: t.icon, color: t.color, description: t.description },
      create: { name: t.name, slug: t.slug, icon: t.icon, color: t.color, description: t.description, sortOrder: i },
    })
    typeBySlug.set(t.slug, et.id)
  }
  console.log(`Event types: ${typeBySlug.size}`)

  // Organisers (from MOCK_ORGANIZERS)
  const orgBySlug = new Map<string, string>()
  for (const o of MOCK_ORGANIZERS) {
    const u = await prisma.user.upsert({
      where: { slug: o.slug },
      update: { name: o.name, verified: o.verified, bio: o.bio, city: o.city, role: "ORGANIZER" },
      create: {
        email: `${o.slug}@hykrz.local`,
        name: o.name,
        slug: o.slug,
        role: "ORGANIZER",
        verified: o.verified,
        bio: o.bio,
        city: o.city,
      },
    })
    orgBySlug.set(o.slug, u.id)
  }
  console.log(`Organisers: ${orgBySlug.size}`)

  // Filler riders pool — used to give events realistic registration counts.
  const pool: string[] = []
  for (let i = 1; i <= 30; i++) {
    const u = await prisma.user.upsert({
      where: { email: `seed-rider-${i}@hykrz.local` },
      update: {},
      create: { email: `seed-rider-${i}@hykrz.local`, name: `Rider ${i}` },
    })
    pool.push(u.id)
  }

  // Events (from MOCK_EVENTS) + confirmed participants
  let eventCount = 0
  for (const e of MOCK_EVENTS) {
    const eventTypeId = typeBySlug.get(e.eventType.slug)
    const organizerId = orgBySlug.get(e.organizer.slug)
    if (!eventTypeId || !organizerId) continue

    const event = await prisma.event.upsert({
      where: { slug: e.slug },
      update: {
        title: e.title,
        description: e.description,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : null,
        capacity: e.capacity,
        price: e.price,
        currency: e.currency,
        status: e.status as EventStatus,
        featured: e.featured,
        eventTypeId,
        organizerId,
      },
      create: {
        title: e.title,
        slug: e.slug,
        description: e.description,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : null,
        startLocation: e.startLocation,
        destination: e.destination,
        capacity: e.capacity,
        price: e.price,
        currency: e.currency,
        status: e.status as EventStatus,
        featured: e.featured,
        eventTypeId,
        organizerId,
      },
    })

    // Attach confirmed participants up to registeredCount (excluding the organiser).
    const target = Math.min(e.registeredCount, pool.length, e.capacity)
    for (let i = 0; i < target; i++) {
      const userId = pool[i]
      if (userId === organizerId) continue
      await prisma.eventParticipant.upsert({
        where: { userId_eventId: { userId, eventId: event.id } },
        update: { status: "CONFIRMED" },
        create: { userId, eventId: event.id, status: "CONFIRMED" },
      })
    }
    eventCount++
  }
  console.log(`Events: ${eventCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
