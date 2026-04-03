"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AiEnhanceButtonProps {
  formData: Record<string, unknown>
  onResult: (data: Record<string, unknown>) => void
  className?: string
}

export function AiEnhanceButton({
  formData,
  onResult,
  className,
}: AiEnhanceButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleEnhance = async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch("/api/ai/enhance-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to enhance")

      const data = await res.json()
      onResult(data)
    } catch {
      // Silently fail — parent can handle missing data
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleEnhance}
      disabled={loading}
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
