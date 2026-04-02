"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Arjun Krishnamurthy",
    role: "Motorcycle Enthusiast",
    city: "Bangalore",
    quote: "HYKRZ completely changed how I find riding buddies. I've done 15 group rides in the last 3 months — something I never imagined doing solo.",
    rating: 5,
    initial: "A",
  },
  {
    name: "Priya Sharma",
    role: "Trek Leader",
    city: "Pune",
    quote: "As an organizer, HYKRZ makes managing group treks effortless. From RSVPs to group chat — everything in one place. My trekking community has grown 3x.",
    rating: 5,
    initial: "P",
  },
  {
    name: "Rahul Menon",
    role: "Cycling Enthusiast",
    city: "Chennai",
    quote: "Found my cycling crew through HYKRZ. Now we ride every weekend. The safety features and group chat make coordinating so easy.",
    rating: 5,
    initial: "R",
  },
]

export function Testimonials() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Loved by{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Adventurers
            </span>
          </h2>
          <p className="text-lg text-zinc-400">
            Hear from people who found their crew on HYKRZ.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 relative"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-orange-500/10" />

              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-amber-500 fill-amber-500" />
                ))}
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-500/10 text-orange-500 font-bold">
                    {t.initial}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role} · {t.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
