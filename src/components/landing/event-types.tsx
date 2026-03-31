"use client"

import { motion } from "framer-motion"
import {
  Bike,
  Mountain,
  Plane,
  Tent,
  Car,
  Footprints,
  Waves,
} from "lucide-react"

const eventTypes = [
  { name: "Motorcycle Rides", icon: Bike, color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { name: "Bicycle Rides", icon: Bike, color: "#22c55e", bg: "bg-green-500/10", border: "border-green-500/20" },
  { name: "Treks & Hikes", icon: Mountain, color: "#8b5cf6", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { name: "Group Travel", icon: Plane, color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { name: "Camping", icon: Tent, color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { name: "Road Trips", icon: Car, color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { name: "Running", icon: Footprints, color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/20" },
  { name: "Water Sports", icon: Waves, color: "#06b6d4", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
]

export function EventTypes() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Every Adventure,{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              One Platform
            </span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            From two-wheelers to two feet — RideConnect supports every kind of
            group adventure.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {eventTypes.map((type, index) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className={`group relative flex flex-col items-center gap-3 rounded-2xl border ${type.border} ${type.bg} p-6 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-lg`}
              style={{ "--hover-shadow": type.color } as React.CSSProperties}
            >
              <type.icon
                className="h-8 w-8 transition-transform group-hover:scale-110"
                style={{ color: type.color }}
              />
              <span className="text-sm font-medium text-zinc-300 text-center">
                {type.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
