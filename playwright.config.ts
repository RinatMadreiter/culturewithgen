import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;

// The site is fully static, so the e2e suite builds it once and serves the
// production output with `astro preview` before running the specs.
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
    // Locally `retries` is 0, so "on-first-retry" captured nothing at all on a
    // developer machine - a failure gave you the list reporter and nothing else.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // `pnpm test` selects chromium only (see package.json). It gates every deploy,
  // and this repo has already hit GitHub Pages deploy-lock contention, so the
  // gate is kept deliberately fast.
  //
  // `pnpm test:cross` runs all three. WebKit is opt-in rather than default
  // because it needs `pnpm exec playwright install webkit` (~90MB), which a
  // plain `pnpm install` does not provide - running it by default would fail on
  // a fresh clone. Worth running before a release: the mobile specs currently
  // exercise chromium at a small viewport, which cannot catch iOS 100vh
  // behaviour, backdrop-filter (Navigation.astro), or text-wrap (Footer.astro).
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
