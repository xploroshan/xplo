"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Dumbbell,
  Backpack,
  Cloud,
  Users,
} from "lucide-react"
import { DifficultyBadge } from "./difficulty-badge"

interface SafetyAssessmentData {
  difficulty: "beginner" | "intermediate" | "advanced" | "expert"
  difficultyScore?: number
  risks: string[]
  fitnessRequirements: string[]
  equipment: string[]
  weatherConsiderations: string[]
  suitableFor: string[]
}

interface SafetyAssessmentProps {
  assessment: SafetyAssessmentData
  className?: string
}

export function SafetyAssessment({
  assessment,
  className,
}: SafetyAssessmentProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`rounded-xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden ${className ?? ""}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Shield className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">
              Safety Assessment
            </h3>
            <p className="text-[10px] text-zinc-500">
              Risks, fitness & equipment info
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DifficultyBadge
            difficulty={assessment.difficulty}
            score={assessment.difficultyScore}
          />
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-zinc-800/50 pt-4">
              {/* Risks */}
              {assessment.risks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Potential Risks
                  </div>
                  <div className="space-y-1.5">
                    {assessment.risks.map((risk, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-zinc-300 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2"
                      >
                        <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fitness Requirements */}
              {assessment.fitnessRequirements.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <Dumbbell className="h-3.5 w-3.5 text-zinc-400" />
                    Fitness Requirements
                  </div>
                  <ul className="space-y-1">
                    {assessment.fitnessRequirements.map((req, i) => (
                      <li
                        key={i}
                        className="text-xs text-zinc-400 flex items-start gap-2"
                      >
                        <span className="text-zinc-600 mt-0.5">-</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Equipment */}
              {assessment.equipment.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <Backpack className="h-3.5 w-3.5 text-zinc-400" />
                    Required Equipment
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {assessment.equipment.map((item) => (
                      <span
                        key={item}
                        className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/50"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Weather Considerations */}
              {assessment.weatherConsiderations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <Cloud className="h-3.5 w-3.5 text-zinc-400" />
                    Weather Considerations
                  </div>
                  <ul className="space-y-1">
                    {assessment.weatherConsiderations.map((note, i) => (
                      <li
                        key={i}
                        className="text-xs text-zinc-400 flex items-start gap-2"
                      >
                        <span className="text-zinc-600 mt-0.5">-</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suitable For */}
              {assessment.suitableFor.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    Who is this for?
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {assessment.suitableFor.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
