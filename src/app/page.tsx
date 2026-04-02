import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { EventTypes } from "@/components/landing/event-types"
import { LiveEventsPreview } from "@/components/landing/live-events-preview"
import { Testimonials } from "@/components/landing/testimonials"
import { CTA } from "@/components/landing/cta"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <div id="features">
          <Features />
        </div>
        <LiveEventsPreview />
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
