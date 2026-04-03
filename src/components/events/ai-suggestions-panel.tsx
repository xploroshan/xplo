"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AiSuggestion {
  key: string
  label: string
  value: string | string[]
}

interface AiSuggestionsPanelProps {
  suggestions: AiSuggestion[]
  onApply: (key: string, value: string | string[]) => void
  onApplyAll: () => void
  onDismiss: () => void
}

export function AiSuggestionsPanel({
  suggestions,
  onApply,
  onApplyAll,
  onDismiss,
}: AiSuggestionsPanelProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set(suggestions.map((s) => s.key))
  )
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set())

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleApply = (suggestion: AiSuggestion) => {
    onApply(suggestion.key, suggestion.value)
    setAppliedKeys((prev) => new Set(prev).add(suggestion.key))
  }

  const handleApplyAll = () => {
    onApplyAll()
    setAppliedKeys(new Set(suggestions.map((s) => s.key)))
  }

  const allApplied = suggestions.every((s) => appliedKeys.has(s.key))

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-orange-500/20 bg-orange-500/5 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-orange-500/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">AI Suggestions</h3>
        </div>
        <div className="flex items-center gap-2">
          {!allApplied && (
            <Button
              size="sm"
              onClick={handleApplyAll}
              className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Apply All
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-7 w-7 text-zinc-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Suggestion Cards */}
      <div className="p-3 space-y-2">
        {suggestions.map((suggestion) => {
          const isExpanded = expandedKeys.has(suggestion.key)
          const isApplied = appliedKeys.has(suggestion.key)

          return (
            <div
              key={suggestion.key}
              className={`rounded-lg border transition-colors ${
                isApplied
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-zinc-800/50 bg-zinc-900/50"
              }`}
            >
              {/* Card Header */}
              <button
                onClick={() => toggleExpand(suggestion.key)}
                className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isApplied && (
                    <Check className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isApplied ? "text-green-300" : "text-white"
                    }`}
                  >
                    {suggestion.label}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </button>

              {/* Card Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      <div className="text-xs text-zinc-400 bg-zinc-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {Array.isArray(suggestion.value) ? (
                          <ul className="space-y-1">
                            {suggestion.value.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-zinc-600 mt-0.5">-</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="whitespace-pre-wrap">
                            {suggestion.value}
                          </p>
                        )}
                      </div>
                      {!isApplied && (
                        <Button
                          size="sm"
                          onClick={() => handleApply(suggestion)}
                          className="h-7 text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
