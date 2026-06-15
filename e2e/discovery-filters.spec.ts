import { test, expect } from "@playwright/test"

// Discovery filters + command palette (anonymous, public).
test.describe("Discovery filters", () => {
  test("type filter reflects in the URL and stays selected", async ({ page }) => {
    await page.goto("/events")
    await page.getByRole("link", { name: /motorcycle/i }).first().click()
    await expect(page).toHaveURL(/type=motorcycle-rides/)
  })

  test("difficulty chips update the URL", async ({ page }) => {
    await page.goto("/events")
    await page.getByRole("link", { name: /^beginner$/i }).first().click()
    await expect(page).toHaveURL(/difficulty=beginner/)
  })

  test("price + availability quick filters update the URL", async ({ page }) => {
    await page.goto("/events")
    await page.getByRole("link", { name: /^free$/i }).first().click()
    await expect(page).toHaveURL(/price=free/)
    await page.getByRole("link", { name: /has spots/i }).first().click()
    await expect(page).toHaveURL(/avail=open/)
  })

  test("map and calendar view toggles work", async ({ page }) => {
    await page.goto("/events")
    await page.getByRole("link", { name: /^map$/i }).first().click()
    await expect(page).toHaveURL(/view=map/)
    await page.getByRole("link", { name: /^calendar$/i }).first().click()
    await expect(page).toHaveURL(/view=calendar/)
  })
})

test.describe("Command palette (⌘K)", () => {
  test("opens from the top bar and routes to the events search", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/events")
    await page.getByTestId("command-palette-trigger").click()
    const input = page.getByTestId("command-palette-input")
    await expect(input).toBeVisible()
    await input.fill("goa")
    await input.press("Enter")
    await expect(page).toHaveURL(/\/events\?q=goa/)
  })
})
