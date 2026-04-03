"use client"

import { Signal } from "lucide-react"

type Difficulty = "beginner" | "intermediate" | "advanced" | "expert"

interface DifficultyBadgeProps {
  difficulty: Difficulty
  score?: number
  className?: string
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { color: string; bg: string; border: string; label: string }
> = {
  beginner: {
    color: "text-green-400",
    bg: "bg-green-500/15",
    border: "border-green-500/20",
    label: "Beginner",
  },
  intermediate: {
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/20",
    label: "Intermediate",
  },
  advanced: {
    color: "text-orange-400",
    bg: "bg-orange-500/15",
    border: "border-orange-500/20",
    label: "Advanced",
  },
  expert: {
    color: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/20",
    label: "Expert",
  },
}

export function DifficultyBadge({
  difficulty,
  score,
  className,
}: DifficultyBadgeProps) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.beginner

  return (
    <div className={`relative inline-flex group ${className ?? ""}`}>
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${config.bg} ${config.color} ${config.border}`}
      >
        <Signal className="h-3 w-3" />
        {config.label}
      </span>

      {score !== undefined && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
          <div className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-[10px] text-zinc-300 whitespace-nowrap shadow-lg">
            Difficulty Score: {score}/10
          </div>
          <div className="w-2 h-2 bg-zinc-800 border-b border-r border-zinc-700 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  )
}
