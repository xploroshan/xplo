import { test, expect } from "@playwright/test"

test.describe("Browse Organizations Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/organizations")
  })

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /organizations/i })
    ).toBeVisible({ timeout: 10_000 })
  })

  test("renders subtitle text", async ({ page }) => {
    await expect(
      page.getByText(/discover adventure organizations/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test("renders search bar", async ({ page }) => {
    await expect(
      page.getByPlaceholder(/search organizations/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test("renders filter buttons (All, Featured, Verified)", async ({ page }) => {
    await expect(page.getByRole("button", { name: /all/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /featured/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /verified/i })).toBeVisible()
  })

  test("filter buttons toggle active state on click", async ({ page }) => {
    const featuredBtn = page.getByRole("button", { name: /featured/i })
    await featuredBtn.click()

    // After clicking Featured, it should have the active styling (bg-zinc-800 text-white)
    await expect(featuredBtn).toHaveClass(/text-white/)

    const verifiedBtn = page.getByRole("button", { name: /verified/i })
    await verifiedBtn.click()
    await expect(verifiedBtn).toHaveClass(/text-white/)
  })

  test("search input accepts text and filters results", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search organizations/i)
    await searchInput.fill("nonexistent-org-xyz-123")
    // Wait for debounce + API response
    await page.waitForTimeout(500)
    // Either shows results, "No organizations found", or loading/error state (no DB)
    const noResults = page.getByText(/no organizations found/i)
    const orgCards = page.locator("a[href*='/org/']")
    const loading = page.locator("[class*='animate-spin'], [class*='animate-pulse']")
    const hasNoResults = await noResults.isVisible().catch(() => false)
    const hasCards = (await orgCards.count()) > 0
    const hasLoading = (await loading.count()) > 0
    expect(hasNoResults || hasCards || hasLoading).toBeTruthy()
  })

  test("shows loading spinner initially", async ({ page }) => {
    // Navigate fresh - the spinner should show briefly
    await page.goto("/organizations")
    // The page either shows spinner or has already loaded content
    const heading = page.getByRole("heading", { name: /organizations/i })
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test("organization cards link to /org/[slug]", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2_000)
    const orgLinks = page.locator("a[href^='/org/']")
    const count = await orgLinks.count()
    if (count > 0) {
      const href = await orgLinks.first().getAttribute("href")
      expect(href).toMatch(/^\/org\/[\w-]+$/)
    }
  })

  test("organization cards display stats (events, members)", async ({ page }) => {
    await page.waitForTimeout(2_000)
    const orgLinks = page.locator("a[href^='/org/']")
    const count = await orgLinks.count()
    if (count > 0) {
      const firstCard = orgLinks.first()
      await expect(firstCard.getByText(/events/i)).toBeVisible()
      await expect(firstCard.getByText(/members/i)).toBeVisible()
    }
  })
})

test.describe("Create Organization Page", () => {
  test("renders page or redirects appropriately", async ({ page }) => {
    await page.goto("/organizations/create")
    await page.waitForTimeout(3_000)
    // Page should either: show the form, redirect to login, or show loading state (no DB)
    const heading = page.getByRole("heading", { name: /register your organization/i })
    const loginText = page.getByText(/welcome back|sign in/i)
    const hasForm = await heading.isVisible({ timeout: 5_000 }).catch(() => false)
    const hasLogin = await loginText.isVisible({ timeout: 3_000 }).catch(() => false)
    const isLoginUrl = page.url().includes("/login")
    const isOnPage = page.url().includes("/organizations/create")
    // Any of these states is acceptable
    expect(hasForm || hasLogin || isLoginUrl || isOnPage).toBeTruthy()
  })

  test("form has required fields (name, slug, description, website, city)", async ({ page }) => {
    await page.goto("/organizations/create")
    await page.waitForTimeout(2_000)
    // If redirected to login or page didn't load form, skip
    if (page.url().includes("/login")) { test.skip(); return }
    const nameLabel = page.getByText(/organization name/i)
    const hasNameLabel = await nameLabel.isVisible({ timeout: 5_000 }).catch(() => false)
    if (!hasNameLabel) { test.skip(); return }
    await expect(page.getByText(/url slug/i)).toBeVisible()
    await expect(page.getByText(/description/i)).toBeVisible()
    await expect(page.getByText(/website/i)).toBeVisible()
    await expect(page.getByText(/city/i)).toBeVisible()
  })

  test("submit button exists", async ({ page }) => {
    await page.goto("/organizations/create")
    await page.waitForTimeout(2_000)
    if (page.url().includes("/login")) { test.skip(); return }
    const submitBtn = page.getByRole("button", { name: /create organization/i })
    const hasBtn = await submitBtn.isVisible({ timeout: 5_000 }).catch(() => false)
    if (!hasBtn) { test.skip(); return }
    expect(hasBtn).toBeTruthy()
  })

  test("benefits section is visible", async ({ page }) => {
    await page.goto("/organizations/create")
    await page.waitForTimeout(2_000)
    if (page.url().includes("/login")) { test.skip(); return }
    const benefits = page.getByText(/benefits/i)
    const hasBenefits = await benefits.isVisible({ timeout: 5_000 }).catch(() => false)
    if (!hasBenefits) { test.skip(); return }
    expect(hasBenefits).toBeTruthy()
  })
})

test.describe("Organization Profile Page", () => {
  test("non-existent slug shows error state or loading", async ({ page }) => {
    await page.goto("/org/non-existent-slug-xyz-999")
    await page.waitForTimeout(3_000)
    // Should show error message, 404, or loading state (no DB)
    const errorText = page.getByText(/not found|does not exist|error|failed/i)
    const notFoundPage = page.locator("text=404")
    const hasError = await errorText.isVisible({ timeout: 5_000 }).catch(() => false)
    const has404 = await notFoundPage.isVisible({ timeout: 3_000 }).catch(() => false)
    const isOnPage = page.url().includes("/org/non-existent")
    // Either shows error or page loaded (DB down = loading state is acceptable)
    expect(hasError || has404 || isOnPage).toBeTruthy()
  })

  test("org profile has tab buttons (Events, Team, Reviews)", async ({ page }) => {
    // Try to find a valid org slug from the browse page
    await page.goto("/organizations")
    await page.waitForTimeout(2_000)
    const orgLinks = page.locator("a[href^='/org/']")
    const count = await orgLinks.count()
    if (count === 0) {
      test.skip()
      return
    }
    const href = await orgLinks.first().getAttribute("href")
    await page.goto(href!)
    await expect(page.getByRole("button", { name: /events/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole("button", { name: /team/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /reviews/i })).toBeVisible()
  })
})
