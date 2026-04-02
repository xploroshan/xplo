import { describe, it, expect } from "vitest"
import {
  loginSchema,
  registerSchema,
  slugSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  passwordSchema,
} from "@/lib/validations/auth"

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "password123" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" })
    expect(result.success).toBe(false)
  })
})

describe("slugSchema", () => {
  it("accepts valid slugs", () => {
    const validSlugs = ["abc", "my-events", "ride-organizer-2024", "a1b2c3"]
    for (const slug of validSlugs) {
      expect(slugSchema.safeParse(slug).success).toBe(true)
    }
  })

  it("rejects slugs shorter than 3 characters", () => {
    expect(slugSchema.safeParse("ab").success).toBe(false)
    expect(slugSchema.safeParse("a").success).toBe(false)
  })

  it("rejects slugs longer than 30 characters", () => {
    const longSlug = "a".repeat(31)
    expect(slugSchema.safeParse(longSlug).success).toBe(false)
  })

  it("rejects uppercase characters", () => {
    expect(slugSchema.safeParse("MySlug").success).toBe(false)
  })

  it("rejects special characters", () => {
    expect(slugSchema.safeParse("my_slug").success).toBe(false)
    expect(slugSchema.safeParse("my.slug").success).toBe(false)
    expect(slugSchema.safeParse("my slug").success).toBe(false)
    expect(slugSchema.safeParse("my@slug").success).toBe(false)
  })

  it("rejects leading hyphens", () => {
    expect(slugSchema.safeParse("-myslug").success).toBe(false)
  })

  it("rejects trailing hyphens", () => {
    expect(slugSchema.safeParse("myslug-").success).toBe(false)
  })

  it("rejects consecutive hyphens", () => {
    expect(slugSchema.safeParse("my--slug").success).toBe(false)
  })

  it("accepts exactly 3 characters", () => {
    expect(slugSchema.safeParse("abc").success).toBe(true)
  })

  it("accepts exactly 30 characters", () => {
    expect(slugSchema.safeParse("a".repeat(30)).success).toBe(true)
  })
})

describe("registerSchema", () => {
  const validUser = {
    name: "John Doe",
    email: "john@example.com",
    password: "StrongPass1!",
    role: "USER" as const,
  }

  const validOrganizer = {
    ...validUser,
    role: "ORGANIZER" as const,
    slug: "john-doe",
  }

  it("accepts valid user registration", () => {
    const result = registerSchema.safeParse(validUser)
    expect(result.success).toBe(true)
  })

  it("accepts valid organizer registration with slug", () => {
    const result = registerSchema.safeParse(validOrganizer)
    expect(result.success).toBe(true)
  })

  it("accepts user registration with optional city", () => {
    const result = registerSchema.safeParse({ ...validUser, city: "Mumbai" })
    expect(result.success).toBe(true)
  })

  it("defaults role to USER when not provided", () => {
    const { role, ...noRole } = validUser
    const result = registerSchema.safeParse(noRole)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe("USER")
    }
  })

  it("rejects organizer without slug", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "StrongPass1!",
      role: "ORGANIZER",
    })
    expect(result.success).toBe(false)
  })

  it("rejects name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...validUser, name: "J" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...validUser, email: "invalid" })
    expect(result.success).toBe(false)
  })

  // Password strength tests
  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...validUser, password: "Aa1!" })
    expect(result.success).toBe(false)
  })

  it("rejects password without uppercase letter", () => {
    const result = registerSchema.safeParse({ ...validUser, password: "strongpass1!" })
    expect(result.success).toBe(false)
  })

  it("rejects password without lowercase letter", () => {
    const result = registerSchema.safeParse({ ...validUser, password: "STRONGPASS1!" })
    expect(result.success).toBe(false)
  })

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({ ...validUser, password: "StrongPass!" })
    expect(result.success).toBe(false)
  })

  it("rejects password without special character", () => {
    const result = registerSchema.safeParse({ ...validUser, password: "StrongPass1" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid role", () => {
    const result = registerSchema.safeParse({ ...validUser, role: "ADMIN" })
    expect(result.success).toBe(false)
  })
})

describe("passwordSchema", () => {
  it("accepts strong password", () => {
    expect(passwordSchema.safeParse("StrongPass1!").success).toBe(true)
  })

  it("rejects password without all requirements", () => {
    expect(passwordSchema.safeParse("short1!").success).toBe(false)
    expect(passwordSchema.safeParse("nouppercase1!").success).toBe(false)
    expect(passwordSchema.safeParse("NOLOWERCASE1!").success).toBe(false)
    expect(passwordSchema.safeParse("NoNumbers!!").success).toBe(false)
    expect(passwordSchema.safeParse("NoSpecialChar1").success).toBe(false)
  })
})

describe("changePasswordSchema", () => {
  it("accepts valid change password data", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1!",
      newPassword: "NewPass1!",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "NewPass1!",
    })
    expect(result.success).toBe(false)
  })

  it("rejects weak new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1!",
      newPassword: "weak",
    })
    expect(result.success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "test@example.com" }).success).toBe(true)
  })

  it("rejects invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-email" }).success).toBe(false)
  })

  it("rejects missing email", () => {
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("accepts valid reset data", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      newPassword: "NewPass1!",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty token", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      newPassword: "NewPass1!",
    })
    expect(result.success).toBe(false)
  })

  it("rejects weak new password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      newPassword: "weak",
    })
    expect(result.success).toBe(false)
  })
})
