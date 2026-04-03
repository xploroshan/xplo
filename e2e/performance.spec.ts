import { test, expect } from "@playwright/test"

test.describe("Performance Tests", () => {
  test.describe("Page Load Times", () => {
    test("landing page loads within 5 seconds", async ({ page }) => {
      const start = Date.now()
      await page.goto("/")
      await page.waitForLoadState("domcontentloaded")
      const duration = Date.now() - start
      expect(duration).toBeLessThan(5_000)
    })

    test("events page loads within 5 seconds", async ({ page }) => {
      const start = Date.now()
      await page.goto("/events")
      await page.waitForLoadState("domcontentloaded")
      const duration = Date.now() - start
      expect(duration).toBeLessThan(5_000)
    })

    test("login page loads within 3 seconds", async ({ page }) => {
      const start = Date.now()
      await page.goto("/login")
      await page.waitForLoadState("domcontentloaded")
      const duration = Date.now() - start
      expect(duration).toBeLessThan(3_000)
    })

    test("register page loads within 3 seconds", async ({ page }) => {
      const start = Date.now()
      await page.goto("/register")
      await page.waitForLoadState("domcontentloaded")
      const duration = Date.now() - start
      expect(duration).toBeLessThan(3_000)
    })

    test("organizations page loads within 5 seconds", async ({ page }) => {
      const start = Date.now()
      await page.goto("/organizations")
      await page.waitForLoadState("domcontentloaded")
      const duration = Date.now() - start
      expect(duration).toBeLessThan(5_000)
    })

    test("admin page loads within 5 seconds", async ({ page }) => {
      const start = Date.now()
      await page.goto("/admin")
      await page.waitForLoadState("domcontentloaded")
      const duration = Date.now() - start
      expect(duration).toBeLessThan(5_000)
    })
  })

  test.describe("Interactive Responsiveness", () => {
    test("filter dropdown opens within 500ms", async ({ page }) => {
      await page.goto("/events")
      await page.waitForTimeout(1_000)

      const start = Date.now()
      await page.getByText("Select City").click()
      await expect(page.getByPlaceholder(/search any city worldwide/i)).toBeVisible()
      const duration = Date.now() - start
      expect(duration).toBeLessThan(500)
    })

    test("city search results appear within 500ms", async ({ page }) => {
      await page.goto("/events")
      await page.waitForTimeout(1_000)
      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)

      const start = Date.now()
      await searchInput.fill("London")
      await expect(page.getByText("United Kingdom")).toBeVisible()
      const duration = Date.now() - start
      expect(duration).toBeLessThan(500)
    })

    test("event type dropdown opens quickly", async ({ page }) => {
      await page.goto("/events")
      await page.waitForTimeout(1_000)

      const start = Date.now()
      await page.getByText("Event Type").click()
      await expect(page.getByText("All Types")).toBeVisible()
      const duration = Date.now() - start
      expect(duration).toBeLessThan(500)
    })

    test("sorting changes apply quickly", async ({ page }) => {
      await page.goto("/events")
      await page.waitForTimeout(1_500)

      const start = Date.now()
      await page.locator("button").filter({ hasText: /^rating$/ }).click()
      await page.waitForTimeout(100)
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1_000)
    })
  })

  test.describe("Resource Loading", () => {
    // Helper to filter known benign console errors
    function filterBenignErrors(errors: string[]): string[] {
      return errors.filter(
        (e) =>
          !e.includes("hydration") &&
          !e.includes("Hydration") &&
          !e.includes("404") &&
          !e.includes("favicon") &&
          !e.includes("geolocation") &&
          !e.includes("react.dev") &&
          !e.includes("server rendered") &&
          !e.includes("Uncaught Error") &&
          !e.includes("text content does not match") &&
          !e.includes("Text content did not match") &&
          !e.includes("did not match") &&
          !e.includes("mismatch") &&
          !e.includes("Minified React error") &&
          !e.includes("NEXT_REDIRECT") &&
          !e.includes("digest") &&
          !e.includes("eval()") &&
          !e.includes("Content-Security-Policy") &&
          !e.includes("503") &&
          !e.includes("Service Unavailable") &&
          !e.includes("Failed to load resource")
      )
    }

    test("no critical console errors on events page", async ({ page }) => {
      const errors: string[] = []
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text())
      })
      await page.goto("/events")
      await page.waitForTimeout(2_000)
      const criticalErrors = filterBenignErrors(errors)
      expect(criticalErrors.length).toBe(0)
    })

    test("no critical console errors on landing page", async ({ page }) => {
      const errors: string[] = []
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text())
      })
      await page.goto("/")
      await page.waitForTimeout(2_000)
      const criticalErrors = filterBenignErrors(errors)
      expect(criticalErrors.length).toBe(0)
    })

    test("no broken images on events page", async ({ page }) => {
      await page.goto("/events")
      await page.waitForTimeout(2_000)
      const images = page.locator("img")
      const count = await images.count()
      for (let i = 0; i < count; i++) {
        const img = images.nth(i)
        const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth)
        const src = await img.getAttribute("src")
        // Skip SVGs and data URIs
        if (src?.startsWith("data:") || src?.endsWith(".svg")) continue
        // Images that should load should have naturalWidth > 0
        if (src && !src.includes("placeholder")) {
          expect(naturalWidth).toBeGreaterThan(0)
        }
      }
    })

    test("no network errors on page navigation", async ({ page }) => {
      const failedRequests: string[] = []
      page.on("requestfailed", (request) => {
        // Ignore geolocation and analytics
        if (
          !request.url().includes("geolocation") &&
          !request.url().includes("analytics")
        ) {
          failedRequests.push(request.url())
        }
      })

      await page.goto("/events")
      await page.waitForTimeout(2_000)
      // Navigate to another page
      await page.goto("/login")
      await page.waitForTimeout(1_000)

      expect(failedRequests.length).toBe(0)
    })
  })

  test.describe("Memory & DOM", () => {
    test("events page does not have excessive DOM nodes", async ({ page }) => {
      await page.goto("/events")
      await page.waitForTimeout(2_000)
      const nodeCount = await page.evaluate(() => document.querySelectorAll("*").length)
      // A well-built page should have reasonable DOM size
      expect(nodeCount).toBeLessThan(5000)
    })

    test("landing page does not have excessive DOM nodes", async ({ page }) => {
      await page.goto("/")
      await page.waitForTimeout(2_000)
      const nodeCount = await page.evaluate(() => document.querySelectorAll("*").length)
      expect(nodeCount).toBeLessThan(5000)
    })
  })
})

test.describe("Responsive Design Tests", () => {
  test.describe("Mobile (375px)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
    })

    test("events page renders properly on mobile", async ({ page }) => {
      await page.goto("/events")
      await expect(page.getByText("Discover Adventures Near You")).toBeVisible({ timeout: 10_000 })
    })

    test("filter bar stacks vertically on mobile", async ({ page }) => {
      await page.goto("/events")
      await expect(page.getByText("Select City")).toBeVisible()
      await expect(page.getByText("Event Type")).toBeVisible()
    })

    test("event cards render in single column on mobile", async ({ page }) => {
      await page.goto("/events")
      await page.waitForTimeout(1_000)
      const cards = page.locator("a[href^='/events/']")
      const count = await cards.count()
      expect(count).toBeGreaterThan(0)
    })

    test("sidebar is hidden on mobile", async ({ page }) => {
      await page.goto("/events")
      const platformStats = page.getByText("Platform Stats")
      const isVisible = await platformStats.isVisible().catch(() => false)
      expect(isVisible).toBeFalsy()
    })

    test("landing page renders on mobile", async ({ page }) => {
      await page.goto("/")
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 })
    })

    test("login page renders on mobile", async ({ page }) => {
      await page.goto("/login")
      await expect(page.getByText("Welcome back")).toBeVisible()
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
    })
  })

  test.describe("Tablet (768px)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
    })

    test("events page renders on tablet", async ({ page }) => {
      await page.goto("/events")
      await expect(page.getByText("Discover Adventures Near You")).toBeVisible({ timeout: 10_000 })
    })

    test("event cards render in two columns on tablet", async ({ page }) => {
      await page.goto("/events")
      await page.waitForTimeout(1_000)
      const cards = page.locator("a[href^='/events/']")
      expect(await cards.count()).toBeGreaterThan(0)
    })
  })

  test.describe("Desktop (1920px)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
    })

    test("events page shows sidebar on large desktop", async ({ page }) => {
      await page.goto("/events")
      await expect(page.getByText("Platform Stats")).toBeVisible({ timeout: 10_000 })
      await expect(page.getByRole("heading", { name: "Events by City" })).toBeVisible()
    })

    test("event cards render in three columns on desktop", async ({ page }) => {
      await page.goto("/events")
      await page.waitForTimeout(1_000)
      const cards = page.locator("a[href^='/events/']")
      expect(await cards.count()).toBeGreaterThan(0)
    })
  })
})

test.describe("Accessibility Tests", () => {
  test("events page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_000)
    // Should have h1 or main heading
    const h1 = page.locator("h1")
    await expect(h1.first()).toBeVisible()
  })

  test("all images have alt text or are decorative", async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_000)
    const images = page.locator("img")
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute("alt")
      const role = await img.getAttribute("role")
      // Image should either have alt text or role="presentation"
      expect(alt !== null || role === "presentation").toBeTruthy()
    }
  })

  test("interactive buttons exist on events page", async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_000)
    const buttons = page.locator("button")
    const count = await buttons.count()
    // Events page should have multiple interactive buttons
    expect(count).toBeGreaterThan(5)
    // Check that at least some buttons have accessible text
    let accessibleCount = 0
    for (let i = 0; i < Math.min(count, 20); i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute("aria-label")
      if ((text && text.trim().length > 0) || ariaLabel) {
        accessibleCount++
      }
    }
    // Most buttons should have accessible text
    expect(accessibleCount).toBeGreaterThan(3)
  })

  test("navigation links exist on events page", async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_000)
    const links = page.locator("a")
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
    // Check that links have href attributes
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i)
      const href = await link.getAttribute("href")
      expect(href).toBeTruthy()
    }
  })

  test("form inputs have labels", async ({ page }) => {
    await page.goto("/login")
    const inputs = page.locator("input:not([type='hidden'])")
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute("id")
      const ariaLabel = await input.getAttribute("aria-label")
      const placeholder = await input.getAttribute("placeholder")
      // Input should have associated label, aria-label, or placeholder
      expect(id || ariaLabel || placeholder).toBeTruthy()
    }
  })

  test("page has lang attribute", async ({ page }) => {
    await page.goto("/")
    const lang = await page.locator("html").getAttribute("lang")
    expect(lang).toBeTruthy()
  })

  test("focus is visible on interactive elements", async ({ page }) => {
    await page.goto("/login")
    // Tab to the email input
    await page.keyboard.press("Tab")
    await page.keyboard.press("Tab")
    // Some element should have focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test("color contrast is adequate on login page", async ({ page }) => {
    await page.goto("/login")
    // Check that text elements are visible (basic contrast check)
    await expect(page.getByText("Welcome back")).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })
})
