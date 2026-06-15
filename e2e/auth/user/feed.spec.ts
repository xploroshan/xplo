import { test, expect } from "@playwright/test"

// Signed in as the E2E rider.
test.describe("Feed", () => {
  test("renders the feed for an authed user (not a login redirect)", async ({ page }) => {
    await page.goto("/feed")
    await expect(page).toHaveURL(/\/feed/)
  })

  test("shows the For you / Following tabs", async ({ page }) => {
    await page.goto("/feed")
    await expect(page.getByText(/for you/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/following/i).first()).toBeVisible()
  })
})
