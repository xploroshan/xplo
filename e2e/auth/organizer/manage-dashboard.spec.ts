import { test, expect } from "@playwright/test"
import { E2E_EVENTS } from "../../constants"

// Signed in as the E2E organizer, who owns all E2E events.
test.describe("Manage dashboard", () => {
  test("renders all management tabs", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENTS.free}/manage`)
    for (const key of ["roster", "insights", "tickets", "revenue", "edit", "broadcast"]) {
      await expect(page.getByTestId(`manage-tab-${key}`)).toBeVisible({ timeout: 10_000 })
    }
  })

  test("insights shows the attendance funnel for a completed event", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENTS.completed}/manage`)
    await page.getByTestId("manage-tab-insights").click()
    await expect(page.getByText(/attendance funnel/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/signed up/i).first()).toBeVisible()
  })

  test("revenue tab shows the empty-state for a free event", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENTS.free}/manage`)
    await page.getByTestId("manage-tab-revenue").click()
    await expect(page.getByText(/no paid orders yet/i)).toBeVisible({ timeout: 10_000 })
  })
})
