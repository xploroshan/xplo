import { z } from "zod/v4"

export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(5000).optional(),
  eventTypeId: z.string().min(1, "Event type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  startLocation: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string(),
    })
    .optional(),
  destination: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string(),
    })
    .optional(),
  capacity: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
