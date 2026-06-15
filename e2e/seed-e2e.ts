/**
 * Deterministic, idempotent seed for E2E runs. Unlike prisma/seed.ts (whose
 * users have no password), this creates known accounts with bcrypt hashes so
 * Playwright can log in via the credentials provider, plus a fixed set of
 * events/org that the specs target. Safe to run repeatedly (all upserts).
 *
 * Run: DATABASE_URL=... npm run db:seed:e2e
 */
import { PrismaClient, type EventStatus } from "@prisma/client"
import bcrypt from "bcryptjs"
import { DEFAULT_EVENT_TYPES } from "../src/lib/constants"
import { E2E_PASSWORD, E2E_USERS, E2E_ORG_SLUG, E2E_EVENTS } from "./constants"

const prisma = new PrismaClient()

function daysFromNow(d: number): Date {
  const t = new Date()
  t.setDate(t.getDate() + d)
  t.setHours(7, 0, 0, 0)
  return t
}

async function main() {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10)

  // Event types (shared with the app's taxonomy).
  const typeBySlug = new Map<string, string>()
  for (const [i, t] of DEFAULT_EVENT_TYPES.entries()) {
    const et = await prisma.eventType.upsert({
      where: { slug: t.slug },
      update: {},
      create: { name: t.name, slug: t.slug, icon: t.icon, color: t.color, description: t.description, sortOrder: i },
    })
    typeBySlug.set(t.slug, et.id)
  }
  const rideType = typeBySlug.get("motorcycle-rides")!

  // Known accounts (verified email so onboarding/verify nudges stay quiet).
  const rider = await prisma.user.upsert({
    where: { email: E2E_USERS.rider },
    update: { passwordHash, emailVerified: new Date() },
    create: { email: E2E_USERS.rider, name: "E2E Rider", passwordHash, emailVerified: new Date(), city: "Bangalore", role: "USER" },
  })
  const organizer = await prisma.user.upsert({
    where: { email: E2E_USERS.organizer },
    update: { passwordHash, emailVerified: new Date(), role: "ORGANIZER", slug: "e2e-org" },
    create: { email: E2E_USERS.organizer, name: "E2E Organizer", passwordHash, emailVerified: new Date(), city: "Bangalore", role: "ORGANIZER", slug: "e2e-org", verified: true, bio: "E2E test organizer" },
  })
  await prisma.user.upsert({
    where: { email: E2E_USERS.admin },
    update: { passwordHash, emailVerified: new Date(), role: "SUPER_ADMIN" },
    create: { email: E2E_USERS.admin, name: "E2E Admin", passwordHash, emailVerified: new Date(), role: "SUPER_ADMIN" },
  })

  // A pool of filler riders to fill capacity / leave reviews.
  const fillers: string[] = []
  for (let i = 1; i <= 5; i++) {
    const u = await prisma.user.upsert({
      where: { email: `e2e-filler-${i}@e2e.test` },
      update: {},
      create: { email: `e2e-filler-${i}@e2e.test`, name: `Filler ${i}`, role: "USER" },
    })
    fillers.push(u.id)
  }

  // Organization owned by the organizer (for the org dashboard spec).
  const org = await prisma.organization.upsert({
    where: { slug: E2E_ORG_SLUG },
    update: { status: "ACTIVE" },
    create: { name: "E2E Adventure Club", slug: E2E_ORG_SLUG, city: "Bangalore", status: "ACTIVE", verified: true },
  })
  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: organizer.id, organizationId: org.id } },
    update: { role: "OWNER" },
    create: { userId: organizer.id, organizationId: org.id, role: "OWNER" },
  })

  // Helper to upsert an event owned by the organizer.
  async function event(slug: string, data: {
    title: string; status: EventStatus; capacity?: number | null; price?: number; startDate: Date
  }) {
    return prisma.event.upsert({
      where: { slug },
      update: { title: data.title, status: data.status, capacity: data.capacity ?? null, price: data.price ?? 0, startDate: data.startDate, organizerId: organizer.id, eventTypeId: rideType },
      create: {
        title: data.title, slug, status: data.status, capacity: data.capacity ?? null, price: data.price ?? 0,
        startDate: data.startDate, organizerId: organizer.id, eventTypeId: rideType,
        description: "An E2E test ride.",
        startLocation: { address: "MG Road, Bangalore", lat: 12.9756, lng: 77.6068 },
        destination: { address: "Nandi Hills", lat: 13.3702, lng: 77.6835 },
      },
    })
  }

  const free = await event(E2E_EVENTS.free, { title: "E2E Free Ride", status: "OPEN", capacity: 30, startDate: daysFromNow(14) })
  const full = await event(E2E_EVENTS.full, { title: "E2E Full Ride", status: "OPEN", capacity: 2, startDate: daysFromNow(10) })
  const completed = await event(E2E_EVENTS.completed, { title: "E2E Completed Ride", status: "COMPLETED", capacity: 20, startDate: daysFromNow(-7) })
  await event(E2E_EVENTS.draft, { title: "E2E Draft Ride", status: "DRAFT", capacity: 10, startDate: daysFromNow(21) })
  // An OPEN ride the rider is already confirmed on — drives chat + pass specs
  // without disturbing the RSVP spec's event.
  const member = await event(E2E_EVENTS.member, { title: "E2E Member Ride", status: "OPEN", capacity: 30, startDate: daysFromNow(12) })
  await prisma.eventParticipant.upsert({
    where: { userId_eventId: { userId: rider.id, eventId: member.id } },
    update: { status: "CONFIRMED" },
    create: { userId: rider.id, eventId: member.id, status: "CONFIRMED" },
  })

  // Reset the rider's participation on the RSVP-target events so those specs
  // start clean every run (the rider joins/cancels them during tests).
  await prisma.eventParticipant.deleteMany({
    where: { userId: rider.id, eventId: { in: [free.id, full.id] } },
  })

  // Fill the "full" event so a fresh RSVP is waitlisted.
  for (let i = 0; i < 2; i++) {
    await prisma.eventParticipant.upsert({
      where: { userId_eventId: { userId: fillers[i], eventId: full.id } },
      update: { status: "CONFIRMED" },
      create: { userId: fillers[i], eventId: full.id, status: "CONFIRMED" },
    })
  }

  // Completed event has confirmed riders + a review (drives Insights + ratings).
  await prisma.eventParticipant.upsert({
    where: { userId_eventId: { userId: rider.id, eventId: completed.id } },
    update: { status: "CONFIRMED", checkedInAt: daysFromNow(-7), rating: 5, review: "Great ride!" },
    create: { userId: rider.id, eventId: completed.id, status: "CONFIRMED", checkedInAt: daysFromNow(-7), rating: 5, review: "Great ride!" },
  })
  await prisma.eventParticipant.upsert({
    where: { userId_eventId: { userId: fillers[0], eventId: completed.id } },
    update: { status: "CONFIRMED", rating: 4 },
    create: { userId: fillers[0], eventId: completed.id, status: "CONFIRMED", rating: 4 },
  })

  // eslint-disable-next-line no-console
  console.log(`E2E seed done — free=${free.slug} full=${full.slug} completed=${completed.slug} org=${org.slug}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
