import { test, expect } from "@playwright/test";

const EMAIL = "culturewithgen@gmail.com";
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

test.describe("Email copy-to-clipboard toast", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("footer link copies the address and shows the English toast", async ({
    page,
  }) => {
    await page.goto("/");
    const footerLink = page.locator("footer a.js-email");
    await footerLink.click();

    const toast = page.locator(".email-toast");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText("Email copied to clipboard");

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(EMAIL);
  });

  test("footer link shows the German toast on /de/", async ({ page }) => {
    await page.goto("/de/");
    const footerLink = page.locator("footer a.js-email");
    await footerLink.click();

    const toast = page.locator(".email-toast");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText("E-Mail in die Zwischenablage kopiert");

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(EMAIL);
  });

  test("only the footer link opts into copy; the Contact CTA keeps mailto", async ({
    page,
  }) => {
    await page.goto("/");
    // The footer link opts into copy-on-click.
    await expect(page.locator("footer a.js-email")).toHaveAttribute(
      "data-copy",
      "",
    );
    // The Contact CTA (in <main>) does not, so it still opens the mail client.
    const cta = page.locator("main a.js-email");
    await expect(cta).not.toHaveAttribute("data-copy", /.*/);
    await cta.focus();
    await expect(cta).toHaveAttribute("href", `mailto:${EMAIL}`);
  });
});
