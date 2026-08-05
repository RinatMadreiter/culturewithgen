import { test, expect } from "@playwright/test";

const EMAIL = "culturewithgen@gmail.com";

// The footer no longer repeats the address - Contact's CTA sits directly above
// it. `e2e/footer.spec.ts` guards against the duplicate creeping back in.
test.describe("Contact CTA email (obfuscated)", () => {
  test("link stays inert until the user interacts", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("main a.js-email").first();
    // Before any interaction the link is inert - a DOM-snapshot scraper sees "#".
    await expect(link).toHaveAttribute("href", "#");
  });

  test("email is revealed on user intent", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("main a.js-email").first();
    // Focus is genuine user intent and fires before keyboard activation.
    await link.focus();
    await expect(link).toHaveAttribute("href", `mailto:${EMAIL}`);
    await expect(link).toContainText(EMAIL);
  });
});
