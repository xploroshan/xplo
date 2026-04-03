import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test("renders login form", async ({ page }) => {
      await page.goto("/login")
      await expect(page.getByText("Welcome back")).toBeVisible()
      await expect(page.getByPlaceholder("you@example.com")).toBeVisible()
      await expect(page.getByPlaceholder("Enter your password")).toBeVisible()
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
    })

    test("shows error for invalid credentials", async ({ page }) => {
      await page.goto("/login")
      await page.getByPlaceholder("you@example.com").fill("fake@example.com")
      await page.getByPlaceholder("Enter your password").fill("wrongpassword")
      await page.getByRole("button", { name: /sign in/i }).click()

      await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10_000 })
    })

    test("shows validation for empty fields", async ({ page }) => {
      await page.goto("/login")
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/login/)
    })

    test("password toggle works", async ({ page }) => {
      await page.goto("/login")
      const passwordInput = page.getByPlaceholder("Enter your password")
      await passwordInput.fill("testpassword")

      // Initially type=password
      await expect(passwordInput).toHaveAttribute("type", "password")

      // The toggle is a sibling button inside the same relative div as the password input
      const passwordContainer = passwordInput.locator("..")
      const toggleButton = passwordContainer.locator("button")
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute("type", "text")
    })

    test("has link to register page", async ({ page }) => {
      await page.goto("/login")
      const signUpLink = page.getByRole("link", { name: /sign up free/i })
      await expect(signUpLink).toBeVisible()
      await signUpLink.click()
      await expect(page).toHaveURL(/\/register/)
    })

    test("has forgot password link", async ({ page }) => {
      await page.goto("/login")
      const forgotLink = page.getByRole("link", { name: /forgot password/i })
      await expect(forgotLink).toBeVisible()
      await forgotLink.click()
      await expect(page).toHaveURL(/\/forgot-password/)
    })

    test("has Google OAuth button", async ({ page }) => {
      await page.goto("/login")
      await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible()
    })
  })

  test.describe("Register Page", () => {
    test("renders register form", async ({ page }) => {
      await page.goto("/register")
      await expect(page.getByText("Create your account")).toBeVisible()
      await expect(page.getByPlaceholder("John Doe")).toBeVisible()
      await expect(page.getByPlaceholder("you@example.com")).toBeVisible()
      await expect(page.getByPlaceholder(/min 8 chars/i)).toBeVisible()
    })

    test("role toggle switches between User and Organizer", async ({ page }) => {
      await page.goto("/register")

      const joinButton = page.getByRole("button", { name: /join events/i })
      const organizeButton = page.getByRole("button", { name: /organize events/i })

      await expect(joinButton).toBeVisible()
      await expect(organizeButton).toBeVisible()

      // Switch to organizer
      await organizeButton.click()

      // Slug field should appear for organizers
      await expect(page.getByPlaceholder("your-name")).toBeVisible()
    })

    test("organizer slug field sanitizes input", async ({ page }) => {
      await page.goto("/register")
      await page.getByRole("button", { name: /organize events/i }).click()

      const slugInput = page.getByPlaceholder("your-name")
      await slugInput.fill("My Org Name!")

      // Should sanitize to lowercase alphanumeric with hyphens
      await expect(slugInput).toHaveValue("myorgname")
    })

    test("has link back to login", async ({ page }) => {
      await page.goto("/register")
      const signInLink = page.getByRole("link", { name: /sign in/i })
      await expect(signInLink).toBeVisible()
      await signInLink.click()
      await expect(page).toHaveURL(/\/login/)
    })

    test("shows terms and privacy links", async ({ page }) => {
      await page.goto("/register")
      await expect(page.getByRole("link", { name: /terms/i })).toBeVisible()
      await expect(page.getByRole("link", { name: /privacy/i })).toBeVisible()
    })
  })

  test.describe("Forgot Password Page", () => {
    test("renders forgot password form", async ({ page }) => {
      await page.goto("/forgot-password")
      await expect(page.getByPlaceholder("you@example.com")).toBeVisible()
    })
  })
})
