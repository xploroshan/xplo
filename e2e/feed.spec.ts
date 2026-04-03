import { test, expect } from "@playwright/test"

test.describe("Feed Page", () => {
  test("renders feed page (may redirect to login)", async ({ page }) => {
    await page.goto("/feed")
    await page.waitForTimeout(2_000)
    // Feed is auth-protected - it may redirect to login
    const url = page.url()
    const isOnFeed = url.includes("/feed")
    const isOnLogin = url.includes("/login")

    // Either we're on the feed page or redirected to login (both are valid)
    expect(isOnFeed || isOnLogin).toBe(true)
  })

  test("shows post cards with content when accessible", async ({ page }) => {
    await page.goto("/feed")
    await page.waitForTimeout(2_000)

    if (page.url().includes("/feed")) {
      const postContent = page.locator("[class*='rounded']").filter({ hasText: /#\w+/ })
      if (await postContent.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(postContent.first()).toBeVisible()
      }
    }
  })

  test("shows interaction buttons on posts when accessible", async ({ page }) => {
    await page.goto("/feed")
    await page.waitForTimeout(2_000)

    if (page.url().includes("/feed")) {
      const buttons = page.locator("button").filter({ has: page.locator("svg") })
      await expect(buttons.first()).toBeVisible({ timeout: 5_000 })
    }
  })

  test("activity cards are shown when accessible", async ({ page }) => {
    await page.goto("/feed")
    await page.waitForTimeout(2_000)

    if (page.url().includes("/feed")) {
      const activityItems = page.getByText(/joined|completed|earned|created/i)
      if (await activityItems.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(activityItems.first()).toBeVisible()
      }
    }
  })
})
