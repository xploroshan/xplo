import { test, expect } from "@playwright/test"
import { E2E_EVENTS } from "../../constants"

// Signed in as the E2E rider, who is confirmed on the member ride.
test.describe("Event group chat", () => {
  test("a member can open the chat and post a message", async ({ page }) => {
    await page.goto(`/events/${E2E_EVENTS.member}/chat`)
    // The composer renders for the active breakpoint; target the visible one.
    const composer = page.locator('textarea[placeholder^="Message the group"]:visible')
    await expect(composer).toBeVisible({ timeout: 10_000 })

    const msg = `hello from e2e ${Date.now()}`
    await composer.fill(msg)
    await composer.press("Enter")
    // Optimistic + polled render shows the message in the thread.
    await expect(page.getByText(msg).first()).toBeVisible({ timeout: 10_000 })
  })
})
