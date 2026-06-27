import { test, expect } from "@playwright/test";

const EMAIL = "hello@example.com";

test.describe("Email spam protection", () => {
  test("raw email is absent from the static HTML", async ({ request }) => {
    const html = await (await request.get("/")).text();
    // The full address must never appear as plain text for scrapers to harvest.
    expect(html).not.toContain(EMAIL);
    expect(html).not.toContain(`mailto:${EMAIL}`);
  });

  test("email link is assembled client-side after load", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator(`a[href="mailto:${EMAIL}"]`).first(),
    ).toBeVisible();
  });
});
