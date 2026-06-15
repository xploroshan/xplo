import { test, expect } from "@playwright/test"

// Signed in as the E2E organizer.
test.describe("Create event (no AI keys needed)", () => {
  test("the AI button is gated until title + type are set", async ({ page }) => {
    await page.goto("/events/create")
    const ai = page.getByRole("button", { name: /generate with ai/i })
    await expect(ai).toBeDisabled()
  })

  test("publishes a new event and shows the success screen", async ({ page }) => {
    await page.goto("/events/create")

    await page.getByPlaceholder("e.g. Weekend Ride to Goa").fill("E2E Created Ride")
    // Event type radio (label carries the type name).
    await page.getByText("Motorcycle Rides", { exact: true }).click()
    // Start date (datetime-local).
    await page.locator('input[name="startDate"]').fill("2026-09-01T07:00")
    // Difficulty select (added in PR A).
    await page.locator('select[name="difficulty"]').selectOption("intermediate")

    await page.getByRole("button", { name: /publish event/i }).click()

    // PublishedSuccess screen.
    await expect(page.getByText(/you're live/i)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole("link", { name: /view event/i })).toBeVisible()
  })

  test("the location picker is present for start + destination", async ({ page }) => {
    await page.goto("/events/create")
    await expect(page.getByRole("button", { name: /pick on map/i }).first()).toBeVisible()
  })
})
