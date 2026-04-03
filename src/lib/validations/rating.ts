import { z } from "zod/v4"

export const ratingSubmissionSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(2000).optional(),
})

export type RatingSubmissionInput = z.infer<typeof ratingSubmissionSchema>

export const ratingOverrideSchema = z.object({
  targetType: z.enum(["organization", "user", "event"]),
  targetId: z.string().min(1),
  newValue: z.number().min(0).max(5).nullable(),
  reason: z.string().min(10).max(500),
})

export type RatingOverrideInput = z.infer<typeof ratingOverrideSchema>
