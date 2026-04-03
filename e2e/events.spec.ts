import { test, expect } from "@playwright/test"

test.describe("Events Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_500)
  })

  test("renders search bar", async ({ page }) => {
    await expect(
      page.getByPlaceholder(/search events/i)
    ).toBeVisible()
  })

  test("renders smart filter bar with city selector", async ({ page }) => {
    await expect(page.getByText("Select City")).toBeVisible()
  })

  test("renders smart filter bar with event type selector", async ({ page }) => {
    await expect(page.locator("button").filter({ hasText: "Event Type" })).toBeVisible()
  })

  test("event cards are rendered", async ({ page }) => {
    const eventCards = page.locator("a[href^='/events/']")
    await expect(eventCards.first()).toBeVisible({ timeout: 10_000 })
  })

  test("platform stats sidebar visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/events")
    await expect(page.getByText("Platform Stats")).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText("Active Events")).toBeVisible()
  })

  test("event card links exist", async ({ page }) => {
    const eventLinks = page.locator("a[href*='/events/']")
    const count = await eventLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe("Event Detail Page", () => {
  test("event detail links are well-formed", async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_500)

    const firstLink = page.locator("a[href*='/events/']").first()
    const href = await firstLink.getAttribute("href")
    expect(href).toMatch(/^\/events\/[\w-]+$/)
  })
})
