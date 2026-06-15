import { test, expect } from "@playwright/test"
import { E2E_EVENTS } from "../../constants"

// Signed in as the E2E rider (not the organizer).
test.describe("Access control", () => {
  test("a non-organizer cannot open the manage dashboard (404)", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENTS.free}/manage`)
    // The page calls notFound() for non-organizers.
    await expect(page.getByText(/page not found|not found|404/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
