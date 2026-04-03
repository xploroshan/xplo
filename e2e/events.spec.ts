import { test, expect } from "@playwright/test"

test.describe("Events Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events")
  })

  test("renders search bar", async ({ page }) => {
    await expect(
      page.getByPlaceholder(/search events/i)
    ).toBeVisible()
  })

  test("renders category filter pills", async ({ page }) => {
    await expect(page.getByRole("button", { name: /all events/i })).toBeVisible()
  })

  test("category filter buttons are clickable", async ({ page }) => {
    const allEventsBtn = page.getByRole("button", { name: /all events/i })
    await expect(allEventsBtn).toBeVisible()

    // Click a category pill (not "All Events")
    const categoryButtons = page.locator("button").filter({ hasText: /Motorcycle|Cycling|Trekking|Road Trip|Camping|Backpacking|Water Sports/i })

    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click()
      // Wait briefly for the filter to apply
      await page.waitForTimeout(500)

      // Click back to all
      await allEventsBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test("event cards are rendered", async ({ page }) => {
    // Should see event cards with titles
    const eventCards = page.locator("[class*='rounded-2xl']").filter({ has: page.locator("h3") })
    await expect(eventCards.first()).toBeVisible({ timeout: 10_000 })
  })

  test("platform stats sidebar visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/events")
    await expect(page.getByText("Platform Stats")).toBeVisible()
    await expect(page.getByText("Active Events")).toBeVisible()
  })

  test("event card links exist", async ({ page }) => {
    // Find event card links
    const eventLinks = page.locator("a[href*='/events/']")
    const count = await eventLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe("Event Detail Page", () => {
  test("event detail links are well-formed", async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_000)

    // Verify event links exist and follow /events/slug pattern
    const firstLink = page.locator("a[href*='/events/']").first()
    const href = await firstLink.getAttribute("href")
    expect(href).toMatch(/^\/events\/[\w-]+$/)
  })
})
