import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { EventTypes } from "@/components/landing/event-types"
import { LiveEventsPreview } from "@/components/landing/live-events-preview"
import { Testimonials } from "@/components/landing/testimonials"
import { CTA } from "@/components/landing/cta"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { getEvents, toCardEvent } from "@/app/(main)/events/page"
import type { MockEvent } from "@/lib/mock-data"

// Public landing — keep it fresh but cacheable.
export const revalidate = 300

export default async function HomePage() {
  // Real published events (no more mock data); fail soft to an empty preview.
  let previewEvents: MockEvent[]
  try {
    const rows = await getEvents({ status: { in: ["PUBLISHED", "OPEN", "ACTIVE"] } }, 3)
    previewEvents = rows.map(toCardEvent)
  } catch {
    previewEvents = []
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <div id="features">
          <Features />
        </div>
        <LiveEventsPreview events={previewEvents} />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <EventTypes />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
