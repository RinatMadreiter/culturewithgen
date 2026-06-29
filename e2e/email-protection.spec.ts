import { test, expect } from "@playwright/test";

const EMAIL = "hello@example.com";
const [, DOMAIN = ""] = EMAIL.split("@");

test.describe("Email spam protection", () => {
  test("address and its parts are absent from the static HTML", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    // The full address must never appear as plain text for scrapers to harvest.
    expect(html).not.toContain(EMAIL);
    expect(html).not.toContain(`mailto:${EMAIL}`);
    // The address is encoded into one opaque token - no readable parts remain.
    expect(html).not.toContain(`data-user`);
    expect(html).not.toContain(`data-domain`);
    expect(html).not.toContain(DOMAIN); // e.g. "example.com" must not leak
    expect(html).toContain(`data-cfe="`); // the opaque encoded token is present
  });

  test("link stays inert until the user interacts", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("a.js-email").first();
    // Before any interaction the link is inert - a DOM-snapshot scraper sees "#".
    await expect(link).toHaveAttribute("href", "#");
  });

  test("email is revealed on user intent", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("a.js-email").first();
    // Focus is genuine user intent and fires before keyboard activation.
    await link.focus();
    await expect(link).toHaveAttribute("href", `mailto:${EMAIL}`);
    await expect(link).toContainText(EMAIL);
  });
});
