import { chromium, type FullConfig } from "@playwright/test"
import { execSync } from "node:child_process"
import path from "node:path"
import fs from "node:fs"
import { E2E_PASSWORD, E2E_USERS } from "./constants"

export const AUTH_DIR = path.join(__dirname, ".auth")

/**
 * Runs once before the suite: seeds deterministic E2E data, then logs each
 * persona in through the real UI and saves their session as a storageState so
 * authed specs start already signed in.
 */
async function globalSetup(config: FullConfig) {
  // 1. Seed (idempotent). Skip with E2E_SKIP_SEED=1 when the DB is already seeded.
  if (process.env.E2E_SKIP_SEED !== "1") {
    execSync("npx tsx e2e/seed-e2e.ts", { stdio: "inherit" })
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true })
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000"

  const personas: Array<[keyof typeof E2E_USERS, string]> = [
    ["rider", path.join(AUTH_DIR, "user.json")],
    ["organizer", path.join(AUTH_DIR, "organizer.json")],
    ["admin", path.join(AUTH_DIR, "admin.json")],
  ]

  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
  try {
    for (const [persona, file] of personas) {
      const page = await browser.newPage({ baseURL })
      await page.goto("/login")
      await page.locator('input[type="email"]').fill(E2E_USERS[persona])
      await page.locator('input[type="password"]').first().fill(E2E_PASSWORD)
      await page.getByRole("button", { name: /^sign in$/i }).click()
      // Credentials login redirects to /events on success.
      await page.waitForURL(/\/events|\/welcome/, { timeout: 15_000 })
      await page.context().storageState({ path: file })
      await page.close()
    }
  } finally {
    await browser.close()
  }
}

export default globalSetup
