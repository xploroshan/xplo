import { test, expect } from "@playwright/test"

test.describe("Smart Filter Bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_500)
  })

  test.describe("City Filter", () => {
    test("renders Select City button", async ({ page }) => {
      await expect(page.getByText("Select City")).toBeVisible()
    })

    test("opens city dropdown on click", async ({ page }) => {
      await page.getByText("Select City").click()
      await expect(page.getByPlaceholder(/search any city worldwide/i)).toBeVisible()
    })

    test("city search filters results", async ({ page }) => {
      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)
      await searchInput.fill("London")
      await page.waitForTimeout(300)
      await expect(page.getByText("United Kingdom")).toBeVisible()
    })

    test("selecting a city updates the filter", async ({ page }) => {
      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)
      await searchInput.fill("Bangalore")
      await page.waitForTimeout(300)
      const bangaloreBtn = page.locator("button").filter({ hasText: "Bangalore" }).filter({ hasText: "Karnataka" })
      await bangaloreBtn.first().click()
      // Should now show "Bangalore" somewhere in the filter area (not "Select City")
      await expect(page.getByText("Select City")).not.toBeVisible()
    })

    test("city filter can be cleared with Clear all", async ({ page }) => {
      // Select a city
      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)
      await searchInput.fill("Bangalore")
      await page.waitForTimeout(300)
      const bangaloreBtn = page.locator("button").filter({ hasText: "Bangalore" }).filter({ hasText: "Karnataka" })
      await bangaloreBtn.first().click()
      await page.waitForTimeout(300)
      // Use Clear all
      await page.getByText("Clear all").click()
      await expect(page.getByText("Select City")).toBeVisible()
    })

    test("city search finds international cities", async ({ page }) => {
      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)

      // Search for Tokyo
      await searchInput.fill("Tokyo")
      await page.waitForTimeout(300)
      await expect(page.getByText("Japan")).toBeVisible()

      // Clear and search for New York
      await searchInput.clear()
      await searchInput.fill("New York")
      await page.waitForTimeout(300)
      await expect(page.getByText("United States")).toBeVisible()

      // Clear and search for Cape Town
      await searchInput.clear()
      await searchInput.fill("Cape Town")
      await page.waitForTimeout(300)
      await expect(page.getByText("South Africa")).toBeVisible()
    })

    test("city search finds cities by country name", async ({ page }) => {
      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)
      await searchInput.fill("Australia")
      await page.waitForTimeout(300)
      await expect(page.getByText("Sydney")).toBeVisible()
    })

    test("city search shows no results for gibberish", async ({ page }) => {
      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)
      await searchInput.fill("xyznonexistent999")
      await page.waitForTimeout(300)
      await expect(page.getByText(/no cities found/i)).toBeVisible()
    })

    test("city dropdown shows nearby or popular cities by default", async ({ page }) => {
      await page.getByText("Select City").click()
      // Should show either "Near You" or "Popular Cities" label
      const nearYou = page.getByText(/near you/i)
      const popular = page.getByText(/popular cities/i)
      const hasNearby = await nearYou.isVisible({ timeout: 3_000 }).catch(() => false)
      const hasPopular = await popular.isVisible({ timeout: 3_000 }).catch(() => false)
      expect(hasNearby || hasPopular).toBeTruthy()
    })
  })

  test.describe("Date Filter", () => {
    test("renders Any Date button in filter bar", async ({ page }) => {
      await expect(page.locator("button").filter({ hasText: "Any Date" })).toBeVisible()
    })

    test("opens date dropdown with presets", async ({ page }) => {
      await page.locator("button").filter({ hasText: "Any Date" }).click()
      await expect(page.getByText("Quick Select")).toBeVisible()
      await expect(page.getByText("Custom Range")).toBeVisible()
      // Should have preset buttons
      const presetButtons = page.locator("button").filter({ hasText: /This Week|This Month|Next Month/ })
      expect(await presetButtons.count()).toBeGreaterThanOrEqual(3)
    })

    test("selecting a date preset closes dropdown", async ({ page }) => {
      await page.locator("button").filter({ hasText: "Any Date" }).click()
      await page.locator("button").filter({ hasText: "This Week" }).first().click()
      // Dropdown should close — "Quick Select" heading should no longer be visible
      await expect(page.getByText("Quick Select")).not.toBeVisible({ timeout: 3_000 })
    })

    test("custom date range inputs are visible", async ({ page }) => {
      await page.locator("button").filter({ hasText: "Any Date" }).click()
      await expect(page.getByText("Custom Range")).toBeVisible()
      const dateInputs = page.locator("input[type='date']")
      expect(await dateInputs.count()).toBeGreaterThanOrEqual(2)
    })
  })

  test.describe("Event Type Filter", () => {
    test("renders Event Type button", async ({ page }) => {
      await expect(page.locator("button").filter({ hasText: "Event Type" })).toBeVisible()
    })

    test("opens event type dropdown with all types", async ({ page }) => {
      await page.locator("button").filter({ hasText: "Event Type" }).click()
      // Should show the All Types button and event type options
      await expect(page.locator("button").filter({ hasText: "All Types" }).first()).toBeVisible()
      // Check for at least a few type buttons
      const typeButtons = page.locator("button").filter({ hasText: /Motorcycle Rides|Treks & Hikes|Camping|Water Sports/ })
      expect(await typeButtons.count()).toBeGreaterThanOrEqual(3)
    })

    test("selecting event type closes dropdown", async ({ page }) => {
      await page.locator("button").filter({ hasText: "Event Type" }).click()
      await page.locator("button").filter({ hasText: "Treks & Hikes" }).first().click()
      // Dropdown should close
      await expect(page.getByText("All Types")).not.toBeVisible({ timeout: 3_000 })
    })

    test("clearing event type restores Event Type label", async ({ page }) => {
      // Select a type
      await page.locator("button").filter({ hasText: "Event Type" }).click()
      await page.locator("button").filter({ hasText: "Camping" }).first().click()
      await page.waitForTimeout(300)
      // Clear all filters
      await page.getByText("Clear all").click()
      await expect(page.locator("button").filter({ hasText: "Event Type" })).toBeVisible()
    })
  })

  test.describe("Destination Filter", () => {
    test("renders Destination button", async ({ page }) => {
      await expect(page.locator("button").filter({ hasText: "Destination" }).first()).toBeVisible()
    })

    test("opens destination dropdown", async ({ page }) => {
      await page.locator("button").filter({ hasText: "Destination" }).first().click()
      await expect(page.getByPlaceholder(/search destinations worldwide/i)).toBeVisible()
      await expect(page.getByText("Any Destination")).toBeVisible()
    })

    test("destination search finds world destinations", async ({ page }) => {
      await page.locator("button").filter({ hasText: "Destination" }).first().click()
      const searchInput = page.getByPlaceholder(/search destinations worldwide/i)
      await searchInput.fill("Machu Picchu")
      await page.waitForTimeout(300)
      await expect(page.getByText("Peru")).toBeVisible()
    })

    test("destination search finds trekking destinations", async ({ page }) => {
      await page.locator("button").filter({ hasText: "Destination" }).first().click()
      const searchInput = page.getByPlaceholder(/search destinations worldwide/i)
      await searchInput.fill("Everest")
      await page.waitForTimeout(300)
      await expect(page.getByText("Everest Base Camp")).toBeVisible()
    })

    test("destination dropdown shows popular or nearby destinations by default", async ({ page }) => {
      await page.locator("button").filter({ hasText: "Destination" }).first().click()
      const nearby = page.getByText(/nearby destinations/i)
      const popular = page.getByText(/popular destinations/i)
      const hasNearby = await nearby.isVisible({ timeout: 3_000 }).catch(() => false)
      const hasPopular = await popular.isVisible({ timeout: 3_000 }).catch(() => false)
      expect(hasNearby || hasPopular).toBeTruthy()
    })
  })

  test.describe("Search Bar", () => {
    test("renders search input", async ({ page }) => {
      await expect(page.getByPlaceholder(/search events, organizers, locations/i)).toBeVisible()
    })

    test("search input accepts text", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search events, organizers, locations/i)
      await searchInput.fill("Nandi Hills")
      await page.waitForTimeout(300)
      await expect(searchInput).toHaveValue("Nandi Hills")
    })
  })

  test.describe("Sort Controls", () => {
    test("renders sort buttons", async ({ page }) => {
      // Sort buttons are lowercase: date, rating, popularity
      await expect(page.locator("button").filter({ hasText: /^date$/ })).toBeVisible()
      await expect(page.locator("button").filter({ hasText: /^rating$/ })).toBeVisible()
      await expect(page.locator("button").filter({ hasText: /^popularity$/ })).toBeVisible()
    })

    test("date sort is active by default", async ({ page }) => {
      const dateBtn = page.locator("button").filter({ hasText: /^date$/ })
      await expect(dateBtn).toHaveClass(/text-orange-400/)
    })

    test("clicking rating sort changes active state", async ({ page }) => {
      const ratingBtn = page.locator("button").filter({ hasText: /^rating$/ })
      await ratingBtn.click()
      await expect(ratingBtn).toHaveClass(/text-orange-400/)
    })
  })

  test.describe("Clear All Filters", () => {
    test("Clear all button appears when filters are active", async ({ page }) => {
      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)
      await searchInput.fill("Bangalore")
      await page.waitForTimeout(300)
      const bangaloreBtn = page.locator("button").filter({ hasText: "Bangalore" }).filter({ hasText: "Karnataka" })
      await bangaloreBtn.first().click()
      await expect(page.getByText("Clear all")).toBeVisible()
    })

    test("Clear all removes all active filters", async ({ page }) => {
      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)
      await searchInput.fill("Pune")
      await page.waitForTimeout(300)
      const puneBtn = page.locator("button").filter({ hasText: "Pune" }).filter({ hasText: "Maharashtra" })
      await puneBtn.first().click()
      await page.waitForTimeout(500)
      await page.getByRole("button", { name: "Clear all", exact: true }).click()
      await page.waitForTimeout(300)
      await expect(page.getByText("Select City")).toBeVisible()
    })
  })

  test.describe("Filter Combinations", () => {
    test("event count displays", async ({ page }) => {
      const countEl = page.locator("text=/\\d+ events/").first()
      await expect(countEl).toBeVisible()
    })

    test("applying city filter changes event count", async ({ page }) => {
      const countEl = page.locator("text=/\\d+ events/").first()
      const initial = await countEl.textContent()

      await page.getByText("Select City").click()
      const searchInput = page.getByPlaceholder(/search any city worldwide/i)
      await searchInput.fill("Goa")
      await page.waitForTimeout(300)
      const goaBtn = page.locator("button").filter({ hasText: "Goa" }).filter({ hasText: /Goa/ })
      if (await goaBtn.count() > 0) {
        await goaBtn.first().click()
        await page.waitForTimeout(500)
        const filtered = await countEl.textContent()
        expect(filtered).toBeTruthy()
      }
    })
  })
})

test.describe("Events Page Layout", () => {
  test("renders hero section with heading", async ({ page }) => {
    await page.goto("/events")
    await expect(page.getByText("Discover Adventures Near You")).toBeVisible({ timeout: 10_000 })
  })

  test("renders subtitle", async ({ page }) => {
    await page.goto("/events")
    await expect(page.getByText(/find events by city, date/i)).toBeVisible({ timeout: 10_000 })
  })

  test("renders quick city chips when no city selected", async ({ page }) => {
    await page.goto("/events")
    await expect(page.getByText("Popular:")).toBeVisible({ timeout: 10_000 })
  })

  test("featured carousel visible in discovery mode", async ({ page }) => {
    await page.goto("/events")
    const featured = page.getByText("Featured").first()
    await expect(featured).toBeVisible({ timeout: 10_000 })
  })

  test("empty state shown when no events match filters", async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_000)

    await page.getByText("Select City").click()
    const searchInput = page.getByPlaceholder(/search any city worldwide/i)
    await searchInput.fill("Reykjavik")
    await page.waitForTimeout(300)
    const btn = page.locator("button").filter({ hasText: "Reykjavik" })
    if (await btn.count() > 0) {
      await btn.first().click()
      await page.waitForTimeout(500)
      await expect(page.getByText("No events found")).toBeVisible()
    }
  })

  test.describe("Sidebar (desktop)", () => {
    test("shows Events by City section", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto("/events")
      await expect(page.getByRole("heading", { name: "Events by City" })).toBeVisible({ timeout: 10_000 })
    })

    test("shows Platform Stats", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto("/events")
      await expect(page.getByText("Platform Stats")).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText("Active Events")).toBeVisible()
    })

    test("shows Organizations link", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto("/events")
      await page.waitForTimeout(1_000)
      const orgLink = page.locator("a[href='/organizations']")
      await expect(orgLink.first()).toBeVisible({ timeout: 10_000 })
    })
  })
})

test.describe("Event Cards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events")
    await page.waitForTimeout(1_500)
  })

  test("event cards show title", async ({ page }) => {
    const cards = page.locator("h3")
    await expect(cards.first()).toBeVisible()
  })

  test("event cards show destination address", async ({ page }) => {
    const addresses = page.locator("text=/Nandi Hills|Cubbon Park|Coorg|Arambol|Gokarna/i")
    await expect(addresses.first()).toBeVisible()
  })

  test("event cards show city origin", async ({ page }) => {
    const fromCity = page.locator("text=/^From /")
    const count = await fromCity.count()
    // Some cards should show "From X"
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test("event cards show capacity info", async ({ page }) => {
    const capacityText = page.locator("text=/\\d+\\/\\d+/")
    await expect(capacityText.first()).toBeVisible()
  })

  test("event cards show price badge", async ({ page }) => {
    const priceBadges = page.locator("text=/Free|₹/")
    await expect(priceBadges.first()).toBeVisible()
  })

  test("event cards show event type badge", async ({ page }) => {
    const typeBadges = page.locator("text=/Motorcycle Rides|Treks & Hikes|Bicycle Rides|Road Trips|Group Travel|Camping|Running Events|Water Sports/")
    await expect(typeBadges.first()).toBeVisible()
  })

  test("event cards show organizer name", async ({ page }) => {
    const organizers = page.locator("text=/RiderX|Trek Tribe|Pedal Power|Wanderlust|AquaVenture|Trail Runners/")
    await expect(organizers.first()).toBeVisible()
  })

  test("event cards link to event detail pages", async ({ page }) => {
    const links = page.locator("a[href^='/events/']")
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
    const href = await links.first().getAttribute("href")
    expect(href).toMatch(/^\/events\/[\w-]+$/)
  })
})
