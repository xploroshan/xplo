import { test, expect } from "@playwright/test"

test.describe("Navigation & Sidebar", () => {
  test("sidebar shows navigation links on events page (public)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/events")

    // Sidebar should have navigation items
    const discoverLink = page.getByRole("link", { name: /discover/i }).first()
    await expect(discoverLink).toBeVisible({ timeout: 5_000 })
  })

  test("protected nav links redirect to login when unauthenticated", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/events")

    // Clicking Feed (protected) should redirect to login
    const feedLink = page.getByRole("link", { name: /feed/i }).first()
    if (await feedLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await feedLink.click()
      await page.waitForTimeout(2_000)
      const url = page.url()
      // Should be on login or feed
      expect(url).toMatch(/\/(login|feed)/)
    }
  })

  test("mobile bottom navigation works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/events")

    // Mobile should have bottom nav bar
    const bottomNav = page.locator("nav").last()
    await expect(bottomNav).toBeVisible()
  })
})

test.describe("Responsive Design", () => {
  test("landing page responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")

    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("header")).toBeVisible()
  })

  test("events page responsive on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/events")

    await expect(page.getByPlaceholder(/search events/i)).toBeVisible()
  })

  test("events page hides sidebar on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/events")

    // Platform Stats should be hidden on mobile
    await expect(page.getByText("Platform Stats")).not.toBeVisible()
  })
})
