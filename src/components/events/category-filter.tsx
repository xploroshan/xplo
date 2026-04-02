"use client"

import { useUIStore } from "@/stores/ui-store"
import { DEFAULT_EVENT_TYPES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  Bike,
  Mountain,
  Plane,
  Tent,
  Car,
  Footprints,
  Waves,
} from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  Bike, Bicycle: Bike, Mountain, Plane, Tent, Car, Footprints, Waves,
}

interface CategoryFilterProps {
  eventCounts?: Record<string, number>
}

export function CategoryFilter({ eventCounts }: CategoryFilterProps) {
  const { activeCategory, setActiveCategory } = useUIStore()

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => setActiveCategory(null)}
        className={cn(
          "shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all border",
          activeCategory === null
            ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
            : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
        )}
      >
        All Events
      </button>

      {DEFAULT_EVENT_TYPES.map((type) => {
        const Icon = iconMap[type.icon]
        const isActive = activeCategory === type.slug
        const count = eventCounts?.[type.slug]

        return (
          <button
            key={type.slug}
            onClick={() => setActiveCategory(isActive ? null : type.slug)}
            className={cn(
              "shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all border",
              isActive
                ? "border-opacity-30"
                : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
            )}
            style={isActive ? {
              backgroundColor: `${type.color}15`,
              color: type.color,
              borderColor: `${type.color}40`,
            } : undefined}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {type.name}
            {count !== undefined && (
              <span className="text-[10px] opacity-60">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
