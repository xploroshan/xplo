import { test, expect } from "@playwright/test"

// Anonymous project: registers a brand-new account each run (unique email) and
// walks the auto-sign-in → onboarding → events flow end to end.
test.describe("Register + onboarding", () => {
  test("new user registers, lands on /welcome, and finishes onboarding", async ({ page }) => {
    const email = `e2e-new-${Date.now()}@e2e.test`

    await page.goto("/register")
    await page.getByPlaceholder("John Doe").fill("E2E Newbie")
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').first().fill("E2e!pass123")
    await page.getByPlaceholder(/e\.g\. Bangalore/i).fill("Bangalore")
    await page.getByRole("button", { name: /create account/i }).click()

    // Auto sign-in routes to onboarding.
    await page.waitForURL(/\/welcome/, { timeout: 20_000 })

    await page.getByTestId("welcome-city").fill("Bangalore")
    // Pick an interest chip if present.
    const interest = page.getByRole("button", { name: /motorcycle/i }).first()
    if (await interest.isVisible().catch(() => false)) await interest.click()

    await page.getByTestId("welcome-continue").click()
    await page.waitForURL(/\/events/, { timeout: 20_000 })
    await expect(page).toHaveURL(/\/events/)
  })
})
