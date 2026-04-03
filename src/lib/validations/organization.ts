import { z } from "zod/v4"

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  city: z.string().max(100).optional(),
})

export const updateOrganizationSchema = createOrganizationSchema.partial()

export const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "EVENT_MANAGER"]),
  title: z.string().max(100).optional(),
})
