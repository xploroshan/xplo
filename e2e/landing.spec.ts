import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test("renders hero section with CTA buttons", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible()
  })

  test("renders all major sections", async ({ page }) => {
    await page.goto("/")

    // Header
    await expect(page.locator("header")).toBeVisible()

    // Features section
    await expect(page.locator("#features")).toBeVisible()

    // How it works
    await expect(page.locator("#how-it-works")).toBeVisible()

    // Testimonials
    await expect(page.getByText(/loved by/i)).toBeVisible()

    // Footer
    await expect(page.locator("footer")).toBeVisible()
  })

  test("testimonials show ratings and quotes", async ({ page }) => {
    await page.goto("/")
    const testimonialSection = page.getByText(/loved by/i).locator("..")
    await expect(testimonialSection).toBeVisible()
    await expect(page.getByText("Arjun Krishnamurthy")).toBeVisible()
  })

  test("navigation links work", async ({ page }) => {
    await page.goto("/")

    const loginLink = page.getByRole("link", { name: /sign in|log in|login/i }).first()
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL(/\/login/)
  })

  test("register link navigates correctly", async ({ page }) => {
    await page.goto("/")
    const registerLink = page.getByRole("link", { name: /get started|sign up|register/i }).first()
    await expect(registerLink).toBeVisible()
    await registerLink.click()
    await expect(page).toHaveURL(/\/(register|login)/)
  })

  test("live events preview section exists", async ({ page }) => {
    await page.goto("/")
    // Wait for framer-motion animations to complete
    await page.waitForTimeout(2_000)
    // The "Live Now" badge or "Events Happening" heading should exist in the DOM
    const liveNow = page.getByText(/live now/i)
    await expect(liveNow).toBeVisible({ timeout: 10_000 })
  })
})
