import { test, expect } from "@playwright/test"

test.describe("Admin Dashboard", () => {
  test("renders dashboard or redirects to login", async ({ page }) => {
    await page.goto("/admin")
    // Admin requires auth — either shows dashboard or redirects to login
    const dashboardHeading = page.getByRole("heading", { name: /dashboard/i })
    const hasDashboard = await dashboardHeading
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const onLoginPage = page.url().includes("/login")
    expect(hasDashboard || onLoginPage).toBeTruthy()
  })

  test("shows stat cards (Total Users, Active Events, Organizations, Total Ratings)", async ({
    page,
  }) => {
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(page.getByText("Total Users")).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText("Active Events")).toBeVisible()
    await expect(page.getByText("Organizations")).toBeVisible()
    await expect(page.getByText("Total Ratings")).toBeVisible()
  })

  test("shows Recent Events section", async ({ page }) => {
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(page.getByText("Recent Events")).toBeVisible({
      timeout: 10_000,
    })
  })

  test("shows Quick Actions section", async ({ page }) => {
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(page.getByText("Quick Actions")).toBeVisible({
      timeout: 10_000,
    })
  })

  test("quick actions contain Manage Organizations link", async ({ page }) => {
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    const manageOrgsLink = page.getByRole("link", {
      name: /manage organizations/i,
    })
    await expect(manageOrgsLink).toBeVisible({ timeout: 10_000 })
    const href = await manageOrgsLink.getAttribute("href")
    expect(href).toBe("/admin/organizations")
  })

  test("quick actions contain Rating Overrides link", async ({ page }) => {
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    const ratingsLink = page.getByRole("link", { name: /rating overrides/i })
    await expect(ratingsLink).toBeVisible({ timeout: 10_000 })
    const href = await ratingsLink.getAttribute("href")
    expect(href).toBe("/admin/ratings")
  })

  test("quick actions contain User Management link", async ({ page }) => {
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    const usersLink = page.getByRole("link", { name: /user management/i })
    await expect(usersLink).toBeVisible({ timeout: 10_000 })
    const href = await usersLink.getAttribute("href")
    expect(href).toBe("/admin/users")
  })

  test("stat card values are numeric", async ({ page }) => {
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    // The stat values are rendered as text-3xl font-bold text-white
    const statValues = page.locator(".text-3xl.font-bold.text-white")
    await expect(statValues.first()).toBeVisible({ timeout: 10_000 })
    const count = await statValues.count()
    expect(count).toBe(4)
    for (let i = 0; i < count; i++) {
      const text = await statValues.nth(i).textContent()
      // Values should be numeric (possibly with commas like "1,234")
      expect(text).toMatch(/^[\d,]+$/)
    }
  })
})

test.describe("Admin Organizations Page", () => {
  test("renders page heading or redirects to login", async ({ page }) => {
    await page.goto("/admin/organizations")
    const heading = page.getByRole("heading", { name: /organizations/i })
    const hasHeading = await heading
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const onLoginPage = page.url().includes("/login")
    expect(hasHeading || onLoginPage).toBeTruthy()
  })

  test("shows search bar", async ({ page }) => {
    await page.goto("/admin/organizations")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(
      page.getByPlaceholder(/search organizations/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test("shows status filter buttons (All, PENDING, ACTIVE, SUSPENDED)", async ({
    page,
  }) => {
    await page.goto("/admin/organizations")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(
      page.getByRole("button", { name: /^all$/i })
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole("button", { name: /pending/i })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /active/i })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /suspended/i })
    ).toBeVisible()
  })

  test("status filter buttons toggle active state", async ({ page }) => {
    await page.goto("/admin/organizations")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    const pendingBtn = page.getByRole("button", { name: /pending/i })
    await expect(pendingBtn).toBeVisible({ timeout: 10_000 })
    await pendingBtn.click()
    // Active filter should show orange styling
    await expect(pendingBtn).toHaveClass(/border-orange-500/)
  })

  test("table has column headers", async ({ page }) => {
    await page.goto("/admin/organizations")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    // Wait for loading to finish — either table or empty state
    await page.waitForTimeout(3_000)
    const table = page.locator("table")
    const hasTable = await table.isVisible().catch(() => false)
    if (hasTable) {
      await expect(page.getByText("Organization").first()).toBeVisible()
      await expect(page.getByText("Status").first()).toBeVisible()
      await expect(page.getByText("Members").first()).toBeVisible()
    }
  })
})

test.describe("Admin Ratings Page", () => {
  test("renders page heading or redirects to login", async ({ page }) => {
    await page.goto("/admin/ratings")
    const heading = page.getByRole("heading", { name: /rating overrides/i })
    const hasHeading = await heading
      .isVisible({ timeout: 10_000 })
      .catch(() => false)
    const onLoginPage = page.url().includes("/login")
    expect(hasHeading || onLoginPage).toBeTruthy()
  })

  test("shows Apply Override form section", async ({ page }) => {
    await page.goto("/admin/ratings")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(page.getByText("Apply Override")).toBeVisible({
      timeout: 10_000,
    })
  })

  test("shows target type selector buttons (Organization, User, Event)", async ({
    page,
  }) => {
    await page.goto("/admin/ratings")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(
      page.getByRole("button", { name: /organization/i })
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole("button", { name: /^user$/i })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /event/i })
    ).toBeVisible()
  })

  test("target type buttons toggle active state", async ({ page }) => {
    await page.goto("/admin/ratings")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    const userBtn = page.getByRole("button", { name: /^user$/i })
    await expect(userBtn).toBeVisible({ timeout: 10_000 })
    await userBtn.click()
    await expect(userBtn).toHaveClass(/border-orange-500/)
  })

  test("shows Override History section", async ({ page }) => {
    await page.goto("/admin/ratings")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(page.getByText("Override History")).toBeVisible({
      timeout: 10_000,
    })
  })

  test("override form has Target ID input", async ({ page }) => {
    await page.goto("/admin/ratings")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(page.getByText("Target ID")).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByPlaceholder(/enter .* id/i)
    ).toBeVisible()
  })

  test("override form has reason textarea", async ({ page }) => {
    await page.goto("/admin/ratings")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(page.getByText(/reason/i).first()).toBeVisible({
      timeout: 10_000,
    })
    await expect(
      page.getByPlaceholder(/explain why/i)
    ).toBeVisible()
  })

  test("Apply Override button is disabled when form is empty", async ({
    page,
  }) => {
    await page.goto("/admin/ratings")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    const submitBtn = page.getByRole("button", { name: /apply override/i })
    await expect(submitBtn).toBeVisible({ timeout: 10_000 })
    await expect(submitBtn).toBeDisabled()
  })
})

test.describe("Admin Sidebar Navigation", () => {
  test("admin sidebar shows Organizations and Ratings links on desktop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    const sidebar = page.locator("aside")
    await expect(sidebar).toBeVisible({ timeout: 10_000 })
    await expect(
      sidebar.getByRole("link", { name: /organizations/i })
    ).toBeVisible()
    await expect(
      sidebar.getByRole("link", { name: /ratings/i })
    ).toBeVisible()
  })

  test("admin sidebar Organizations link navigates correctly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    const sidebar = page.locator("aside")
    const orgsLink = sidebar.getByRole("link", { name: /organizations/i })
    await expect(orgsLink).toBeVisible({ timeout: 10_000 })
    const href = await orgsLink.getAttribute("href")
    expect(href).toBe("/admin/organizations")
  })

  test("admin sidebar has Back to App link", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/admin")
    if (page.url().includes("/login")) {
      test.skip()
      return
    }
    await expect(
      page.getByRole("link", { name: /back to app/i })
    ).toBeVisible({ timeout: 10_000 })
  })
})
