import { test, expect } from "@playwright/test"

test.describe("Navigation (anonymous)", () => {
  test("desktop sidebar shows the Discover link on /events", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/events")
    await expect(page.getByRole("link", { name: /discover/i }).first()).toBeVisible({ timeout: 5_000 })
  })

  test("mobile shows a bottom navigation bar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/events")
    await expect(page.locator("nav").last()).toBeVisible()
  })
})

test.describe("Responsive design", () => {
  test("landing renders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("header")).toBeVisible()
  })

  test("events search is reachable on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/events")
    await expect(page.getByPlaceholder(/search events/i)).toBeVisible()
  })
})
