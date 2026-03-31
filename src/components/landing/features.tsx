"use client"

import { motion } from "framer-motion"
import {
  Calendar,
  MessageCircle,
  MapPin,
  Camera,
  Shield,
  Users,
} from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Event Discovery",
    description:
      "Browse motorcycle rides, treks, bicycle rides, and group travel events happening in your city. Filter by type, date, and destination.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: MessageCircle,
    title: "Group Chat",
    description:
      "WhatsApp-style group messaging with real-time delivery, reactions, polls, and location sharing. Stay connected with your crew.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: MapPin,
    title: "Live GPS Tracking",
    description:
      "Real-time route painting with Pilot and Sweep roles. See every rider on the map. Never lose your group again.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Camera,
    title: "Social Feed",
    description:
      "Share photos and videos from your adventures. Tag events, add filters, and build your riding portfolio.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Safety First",
    description:
      "SOS button, deviation alerts, and nearby hospitals on the map. End-to-end encrypted messages. Your safety is our priority.",
    gradient: "from-red-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Follow organizers, rate events, and grow your network. From solo riders to large communities — everyone belongs here.",
    gradient: "from-amber-500 to-yellow-500",
  },
]

export function Features() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Ride Together
            </span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            One platform for discovery, communication, tracking, and sharing.
            Built for adventurers, by adventurers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative h-full rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-2xl hover:shadow-orange-500/5">
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/0 to-amber-500/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
