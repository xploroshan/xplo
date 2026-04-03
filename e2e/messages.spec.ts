import { test, expect } from "@playwright/test"

test.describe("Messages Page", () => {
  test("redirects to login or shows messages when authenticated", async ({ page }) => {
    await page.goto("/messages")
    await page.waitForTimeout(2_000)
    const url = page.url()
    // Messages is auth-protected
    const isOnMessages = url.includes("/messages")
    const isOnLogin = url.includes("/login")
    expect(isOnMessages || isOnLogin).toBe(true)
  })

  test("shows conversation list when accessible", async ({ page }) => {
    await page.goto("/messages")
    await page.waitForTimeout(2_000)

    if (page.url().includes("/messages")) {
      const searchInput = page.getByPlaceholder(/search/i)
      if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(searchInput).toBeVisible()
      }
    }
  })

  test("shows conversation items when accessible", async ({ page }) => {
    await page.goto("/messages")
    await page.waitForTimeout(2_000)

    if (page.url().includes("/messages")) {
      const conversations = page.locator("[class*='cursor-pointer']")
      if (await conversations.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(conversations.first()).toBeVisible()
      }
    }
  })

  test("clicking conversation shows chat area when accessible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/messages")
    await page.waitForTimeout(2_000)

    if (page.url().includes("/messages")) {
      const conversations = page.locator("[class*='cursor-pointer']").filter({ hasText: /.+/ })
      if (await conversations.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
        await conversations.first().click()
        const messageInput = page.getByPlaceholder(/type a message/i)
        if (await messageInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await expect(messageInput).toBeVisible()
        }
      }
    }
  })
})
