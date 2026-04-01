import { z } from "zod/v4"
import { slugSchema } from "./auth"

export const upgradeToOrganizerSchema = z.object({
  slug: slugSchema.optional(),
})

export const pinOrganizerSchema = z.object({
  organizerId: z.string().min(1, "Organizer ID is required"),
})

export const followOrganizerSchema = z.object({
  organizerId: z.string().min(1, "Organizer ID is required"),
})

export type UpgradeToOrganizerInput = z.infer<typeof upgradeToOrganizerSchema>
export type PinOrganizerInput = z.infer<typeof pinOrganizerSchema>
export type FollowOrganizerInput = z.infer<typeof followOrganizerSchema>
