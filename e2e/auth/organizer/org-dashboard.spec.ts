import { test, expect } from "@playwright/test"
import { E2E_ORG_SLUG } from "../../constants"

// Signed in as the E2E organizer, who owns the E2E club.
test.describe("Organization dashboard", () => {
  test("a member sees real stats (no 404 / redirect)", async ({ page }) => {
    await page.goto(`/org/${E2E_ORG_SLUG}/dashboard`)
    await expect(page).toHaveURL(new RegExp(`/org/${E2E_ORG_SLUG}/dashboard`))
    await expect(page.getByText(/organization dashboard/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/events this month/i)).toBeVisible()
    await expect(page.getByText(/total participants/i)).toBeVisible()
  })
})
