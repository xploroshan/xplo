"use client"

import { useState } from "react"
import { Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface RateEventFormProps {
  eventId: string
  initialRating?: number | null
  initialReview?: string | null
}

// Post-event rating + review for confirmed participants (event page, once
// the event is COMPLETED). Submits to the existing /rate API.
export function RateEventForm({ eventId, initialRating, initialReview }: RateEventFormProps) {
  const [rating, setRating] = useState(initialRating ?? 0)
  const [hover, setHover] = useState(0)
  const [review, setReview] = useState(initialReview ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch(`/api/events/${eventId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review: review.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not save your rating")
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your rating")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
      <h3 className="text-sm font-semibold text-white mb-1">
        {initialRating ? "Your review" : "How was the ride?"}
      </h3>
      <p className="text-xs text-zinc-500 mb-3">
        Your rating helps other riders trust this organizer.
      </p>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                (hover || rating) >= n
                  ? "text-amber-400 fill-amber-400"
                  : "text-zinc-700"
              )}
            />
          </button>
        ))}
      </div>

      <Textarea
        rows={3}
        placeholder="Anything the next rider should know? (optional)"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={1000}
      />

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      {saved && <p className="text-sm text-green-400 mt-2">Thanks — review saved ✓</p>}

      <Button
        variant="glow"
        className="mt-3 gap-2"
        onClick={submit}
        disabled={saving || rating === 0}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {initialRating ? "Update review" : "Submit review"}
      </Button>
    </div>
  )
}
