import { z } from "zod/v4"

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  city: z.string().max(100).optional(),
})

// Shared microsite/branding fields (also reused for individual organizers).
export const micrositeFields = {
  subdomain: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only")
    .nullable()
    .optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a #rrggbb hex color")
    .nullable()
    .optional(),
  tagline: z.string().max(160).nullable().optional(),
}

export const updateOrganizationSchema = createOrganizationSchema.partial().extend(micrositeFields)

export const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "EVENT_MANAGER"]),
  title: z.string().max(100).optional(),
})
