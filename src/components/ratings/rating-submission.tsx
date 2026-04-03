"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Star, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RatingSubmissionProps {
  eventId: string
  existingRating?: number
  existingReview?: string
  onSubmitted?: () => void
}

export function RatingSubmission({
  eventId,
  existingRating,
  existingReview,
  onSubmitted,
}: RatingSubmissionProps) {
  const [rating, setRating] = useState<number>(existingRating ?? 0)
  const [hoveredStar, setHoveredStar] = useState<number>(0)
  const [review, setReview] = useState<string>(existingReview ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayRating = hoveredStar || rating

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const body: { rating: number; review?: string } = { rating }
      if (review.trim()) {
        body.review = review.trim()
      }

      const res = await fetch(`/api/events/${eventId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to submit rating")
      }

      setIsSubmitted(true)
      onSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 rounded-xl bg-zinc-800/50 p-6 text-center"
      >
        <CheckCircle className="h-10 w-10 text-orange-500" />
        <p className="text-lg font-semibold text-zinc-100">
          Thank you for your rating!
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${
                star <= rating
                  ? "fill-orange-500 text-orange-500"
                  : "text-zinc-600"
              }`}
            />
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-zinc-800/50 p-6">
      <h3 className="text-lg font-semibold text-zinc-100">Rate this event</h3>

      {/* Star selector */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(star)}
            className="cursor-pointer p-0.5 focus:outline-none"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= displayRating
                  ? "fill-orange-500 text-orange-500"
                  : "text-zinc-600"
              }`}
            />
          </motion.button>
        ))}
      </div>

      {/* Review textarea */}
      <div>
        <label
          htmlFor="review"
          className="mb-1.5 block text-sm font-medium text-zinc-400"
        >
          Review (optional)
        </label>
        <textarea
          id="review"
          rows={4}
          maxLength={2000}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience..."
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <p className="mt-1 text-xs text-zinc-500">
          {review.length}/2000 characters
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        variant="glow"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : existingRating ? (
          "Update Rating"
        ) : (
          "Submit Rating"
        )}
      </Button>
    </div>
  )
}
