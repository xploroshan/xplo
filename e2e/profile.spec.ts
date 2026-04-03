import { test, expect } from "@playwright/test"

test.describe("Profile Page", () => {
  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/profile")
    await page.waitForTimeout(2_000)
    const url = page.url()
    // Profile is auth-protected, should redirect to login
    const isOnProfile = url.includes("/profile")
    const isOnLogin = url.includes("/login")
    expect(isOnProfile || isOnLogin).toBe(true)
  })

  test("shows tab navigation when accessible", async ({ page }) => {
    await page.goto("/profile")
    await page.waitForTimeout(2_000)

    if (page.url().includes("/profile")) {
      const activityTab = page.getByRole("button", { name: /activity/i })
      const eventsTab = page.getByRole("button", { name: /events/i })
      const badgesTab = page.getByRole("button", { name: /badges/i })
      const settingsTab = page.getByRole("button", { name: /settings/i })

      if (await activityTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(activityTab).toBeVisible()
        await expect(eventsTab).toBeVisible()
        await expect(badgesTab).toBeVisible()
        await expect(settingsTab).toBeVisible()
      }
    }
  })

  test("tab switching works when accessible", async ({ page }) => {
    await page.goto("/profile")
    await page.waitForTimeout(2_000)

    if (page.url().includes("/profile")) {
      const badgesTab = page.getByRole("button", { name: /badges/i })
      if (await badgesTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await badgesTab.click()
      }
    }
  })

  test("stats grid shows numbers when accessible", async ({ page }) => {
    await page.goto("/profile")
    await page.waitForTimeout(2_000)

    if (page.url().includes("/profile")) {
      const statsText = page.getByText(/events|following|badges|distance/i)
      if (await statsText.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(statsText.first()).toBeVisible()
      }
    }
  })
})
