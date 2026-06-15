import { defineConfig, devices } from "@playwright/test"
import path from "node:path"

const AUTH_DIR = path.join(__dirname, "e2e", ".auth")
const chromeArgs = ["--no-sandbox", "--disable-setuid-sandbox"]

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Anonymous (public pages, auth screens). Specs at e2e/*.spec.ts.
    {
      name: "chromium",
      testIgnore: /e2e\/auth\/.*/,
      use: { ...devices["Desktop Chrome"], launchOptions: { args: chromeArgs } },
    },
    // Authed personas. Specs live in e2e/auth/<persona>/*.spec.ts and inherit
    // that persona's saved session.
    {
      name: "user",
      testMatch: /e2e\/auth\/user\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], launchOptions: { args: chromeArgs }, storageState: path.join(AUTH_DIR, "user.json") },
    },
    {
      name: "organizer",
      testMatch: /e2e\/auth\/organizer\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], launchOptions: { args: chromeArgs }, storageState: path.join(AUTH_DIR, "organizer.json") },
    },
    {
      name: "admin",
      testMatch: /e2e\/auth\/admin\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], launchOptions: { args: chromeArgs }, storageState: path.join(AUTH_DIR, "admin.json") },
    },
  ],
  webServer: {
    // Dev locally for fast iteration; a built server in CI for stability.
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
