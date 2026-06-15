"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AiEnhanceButtonProps {
  /** Static payload. Ignored when `getFormData` is provided. */
  formData?: Record<string, unknown>
  /** Read the latest form values at click time (preferred for live forms). */
  getFormData?: () => Record<string, unknown>
  onResult: (data: Record<string, unknown>) => void
  onError?: (message: string) => void
  disabled?: boolean
  className?: string
}

export function AiEnhanceButton({
  formData,
  getFormData,
  onResult,
  onError,
  disabled,
  className,
}: AiEnhanceButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleEnhance = async () => {
    if (loading) return
    setLoading(true)

    try {
      const payload = getFormData ? getFormData() : (formData ?? {})
      const res = await fetch("/api/ai/enhance-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Couldn't generate suggestions")
      }

      const data = await res.json()
      onResult(data)
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Couldn't generate suggestions")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleEnhance}
      disabled={loading || disabled}
      title={disabled ? "Add a title and pick an event type first" : undefined}
      className={`bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 disabled:opacity-60 ${className ?? ""}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate with AI
        </>
      )}
    </Button>
  )
}
