"use client"

import { Star, StarHalf } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface RatingBreakdown {
  stars: number
  count: number
}

interface RatingSummaryProps {
  avgRating: number
  totalCount: number
  breakdown: RatingBreakdown[]
}

export function RatingSummary({
  avgRating,
  totalCount,
  breakdown,
}: RatingSummaryProps) {
  const fullStars = Math.floor(avgRating)
  const hasHalfStar =
    avgRating - fullStars >= 0.25 && avgRating - fullStars < 0.75
  const adjustedFull =
    avgRating - fullStars >= 0.75 ? fullStars + 1 : fullStars
  const emptyStars = 5 - adjustedFull - (hasHalfStar ? 1 : 0)

  // Sort breakdown descending by stars (5 -> 1)
  const sortedBreakdown = [...breakdown].sort((a, b) => b.stars - a.stars)

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-zinc-100">Ratings & Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Left: large average + stars */}
          <div className="flex flex-col items-center gap-2 sm:min-w-[120px]">
            <span className="text-4xl font-bold text-zinc-100">
              {avgRating.toFixed(1)}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: adjustedFull }).map((_, i) => (
                <Star
                  key={`full-${i}`}
                  className="h-5 w-5 fill-orange-500 text-orange-500"
                />
              ))}
              {hasHalfStar && (
                <div className="relative">
                  <Star className="h-5 w-5 text-zinc-600" />
                  <StarHalf className="absolute inset-0 h-5 w-5 fill-orange-500 text-orange-500" />
                </div>
              )}
              {Array.from({ length: Math.max(0, emptyStars) }).map((_, i) => (
                <Star
                  key={`empty-${i}`}
                  className="h-5 w-5 text-zinc-600"
                />
              ))}
            </div>
            <span className="text-sm text-zinc-400">
              {totalCount} {totalCount === 1 ? "review" : "reviews"}
            </span>
          </div>

          {/* Right: bar chart breakdown */}
          <div className="flex flex-1 flex-col gap-2">
            {sortedBreakdown.map(({ stars, count }) => {
              const percentage =
                totalCount > 0 ? (count / totalCount) * 100 : 0

              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-8 text-right text-sm text-zinc-400">
                    {stars} <span className="text-xs">&#9733;</span>
                  </span>
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-zinc-500">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
