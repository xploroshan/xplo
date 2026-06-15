import { test, expect } from "@playwright/test"

// Signed in as the E2E rider.
test.describe("Profile & account settings", () => {
  test("shows the profile header and stats", async ({ page }) => {
    await page.goto("/profile")
    await expect(page).toHaveURL(/\/profile/)
    await expect(page.getByText("E2E Rider").first()).toBeVisible({ timeout: 10_000 })
    // Stats grid labels.
    await expect(page.getByText(/going/i).first()).toBeVisible()
    await expect(page.getByText(/following/i).first()).toBeVisible()
  })

  test("exposes account & security controls", async ({ page }) => {
    await page.goto("/profile")
    await expect(page.getByText(/account/i).first()).toBeVisible({ timeout: 10_000 })
    // Edit profile, 2FA and password sections live here.
    await expect(page.getByText(/edit profile/i).first()).toBeVisible()
    await expect(page.getByText(/two-factor|2fa/i).first()).toBeVisible()
    await expect(page.getByText(/change password|password/i).first()).toBeVisible()
  })
})
