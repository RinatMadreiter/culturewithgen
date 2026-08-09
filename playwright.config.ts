import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    // Not "on-first-retry": local retries are 0, so it would capture nothing.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // `pnpm test` runs chromium only; `pnpm test:cross` runs all three and needs
  // `pnpm exec playwright install webkit` first.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm preview --port " + PORT,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
