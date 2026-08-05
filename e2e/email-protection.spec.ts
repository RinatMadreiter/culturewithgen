import { test, expect } from "@playwright/test";

const EMAIL = "culturewithgen@gmail.com";

test.describe("Footer email link", () => {
  test("renders as a plain mailto link with the correct address", async ({
    page,
  }) => {
    await page.goto("/");
    const link = page.locator(
      "footer a[href='mailto:culturewithgen@gmail.com']",
    );
    await expect(link).toBeVisible();
    await expect(link).toContainText(EMAIL);
  });

  test("renders correctly on the German page", async ({ page }) => {
    await page.goto("/de/");
    const link = page.locator(
      "footer a[href='mailto:culturewithgen@gmail.com']",
    );
    await expect(link).toBeVisible();
    await expect(link).toContainText(EMAIL);
  });
});

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
