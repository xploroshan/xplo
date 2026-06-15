import { test, expect } from "@playwright/test"

// Signed in as the E2E rider.
test.describe("Messages hub", () => {
  test("renders messages for an authed user (not a login redirect)", async ({ page }) => {
    await page.goto("/messages")
    await expect(page).toHaveURL(/\/messages/)
  })

  test("lists the rider's event group chats", async ({ page }) => {
    await page.goto("/messages")
    // The rider is confirmed on the member ride, so its group chat appears.
    await expect(page.getByText(/E2E Member Ride/i)).toBeVisible({ timeout: 10_000 })
  })
})
