"use client"

import { motion } from "framer-motion"
import { Search, UserPlus, Navigation } from "lucide-react"

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Discover",
    description:
      "Browse events in your city — motorcycle rides, treks, bicycle rides, road trips. Filter by date, destination, and group size.",
  },
  {
    icon: UserPlus,
    step: "02",
    title: "Join",
    description:
      "RSVP to an event with one tap. You're automatically added to the group chat. Meet your crew, plan logistics, get excited.",
  },
  {
    icon: Navigation,
    step: "03",
    title: "Ride",
    description:
      "Follow the Pilot's live route on your map. Track every rider in real-time. Share the adventure on your feed afterwards.",
  },
]

export function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-zinc-950 to-[#0a0a0a]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            How It{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Three simple steps to your next adventure
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative text-center"
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-orange-500/50 to-transparent" />
              )}

              {/* Step number */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full border-2 border-orange-500/30 bg-orange-500/5 mb-6">
                <item.icon className="h-10 w-10 text-orange-500" />
                <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white shadow-lg shadow-orange-500/30">
                  {item.step}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
