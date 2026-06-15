import { test, expect } from "@playwright/test"

// Public discovery page (anonymous).
test.describe("Events discovery", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events")
  })

  test("renders the search input", async ({ page }) => {
    await expect(page.getByPlaceholder(/search events/i)).toBeVisible()
  })

  test("renders category chips (All + a type)", async ({ page }) => {
    await expect(page.getByRole("link", { name: "All" }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /motorcycle/i }).first()).toBeVisible()
  })

  test("renders event cards linking to detail pages", async ({ page }) => {
    const cards = page.locator("a[href^='/events/']")
    await expect(cards.first()).toBeVisible({ timeout: 10_000 })
    const href = await cards.first().getAttribute("href")
    expect(href).toMatch(/^\/events\/[\w-]+$/)
  })

  test("filtering by type updates the URL", async ({ page }) => {
    await page.getByRole("link", { name: /motorcycle/i }).first().click()
    await expect(page).toHaveURL(/type=motorcycle-rides/)
  })
})
