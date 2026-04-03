"use client"

import { Star, StarHalf } from "lucide-react"

interface RatingDisplayProps {
  rating: number
  count?: number
  size?: "sm" | "md" | "lg"
  showCount?: boolean
}

const sizeMap = {
  sm: { star: "h-3.5 w-3.5", text: "text-xs", gap: "gap-0.5" },
  md: { star: "h-5 w-5", text: "text-sm", gap: "gap-0.5" },
  lg: { star: "h-6 w-6", text: "text-base", gap: "gap-1" },
} as const

export function RatingDisplay({
  rating,
  count,
  size = "md",
  showCount = true,
}: RatingDisplayProps) {
  const styles = sizeMap[size]
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75
  const adjustedFull = rating - fullStars >= 0.75 ? fullStars + 1 : fullStars
  const emptyStars = 5 - adjustedFull - (hasHalfStar ? 1 : 0)

  return (
    <div className={`inline-flex items-center ${styles.gap}`}>
      <span className={`font-semibold text-zinc-100 ${styles.text}`}>
        {rating.toFixed(1)}
      </span>
      <div className={`flex ${styles.gap}`}>
        {Array.from({ length: adjustedFull }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${styles.star} fill-orange-500 text-orange-500`}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${styles.star} text-zinc-600`} />
            <StarHalf
              className={`${styles.star} absolute inset-0 fill-orange-500 text-orange-500`}
            />
          </div>
        )}
        {Array.from({ length: Math.max(0, emptyStars) }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${styles.star} text-zinc-600`}
          />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className={`text-zinc-400 ${styles.text}`}>({count})</span>
      )}
    </div>
  )
}
