import { z } from "zod/v4"

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(30, "Slug must be at most 30 characters")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Only lowercase letters, numbers, and hyphens")

// Shared password strength rules
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character")

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please enter a valid email address"),
    password: passwordSchema,
    city: z.string().optional(),
    role: z.enum(["USER", "ORGANIZER"]).default("USER"),
    slug: slugSchema.optional(),
  })
  .refine(
    (data) => data.role !== "ORGANIZER" || (data.slug && data.slug.length >= 3),
    { message: "Profile URL is required for organizers", path: ["slug"] }
  )

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
})

export const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
