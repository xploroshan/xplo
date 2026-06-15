import { test, expect } from "@playwright/test"
import { E2E_EVENTS } from "../../constants"

// Signed in as the E2E rider (storageState from the "user" project).
test.describe("RSVP, waitlist & pass", () => {
  test("RSVP a free event, then cancel", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENTS.free}`)
    const rsvp = page.getByTestId("rsvp-button")
    await expect(rsvp).toBeVisible()
    await expect(rsvp).toHaveText(/reserve my spot/i)

    await rsvp.click()
    await expect(page.getByTestId("rsvp-button")).toHaveText(/you're going/i, { timeout: 10_000 })

    // Cancel (hover state reveals "Cancel registration"; clicking toggles off).
    await page.getByTestId("rsvp-button").click()
    await expect(page.getByTestId("rsvp-button")).toHaveText(/reserve my spot/i, { timeout: 10_000 })
  })

  test("joining a full event shows a waitlist position", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENTS.full}`)
    const rsvp = page.getByTestId("rsvp-button")
    await expect(rsvp).toHaveText(/join waitlist/i)
    await rsvp.click()
    await expect(page.getByText(/on the waitlist/i)).toBeVisible({ timeout: 10_000 })
    // Clean up so re-runs start fresh.
    await page.getByTestId("rsvp-button").click()
  })

  test("a confirmed member can view their e-pass (QR + code)", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENTS.member}/pass`)
    // QR renders as an <img>; a short code is shown too.
    await expect(page.locator("img").first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/E2E Member Ride/i)).toBeVisible()
  })
})
