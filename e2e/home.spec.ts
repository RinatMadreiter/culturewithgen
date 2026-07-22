import { test, expect } from "@playwright/test";
// Assert against the same content source the page renders from, so these
// stay correct when copy is edited via the CMS instead of drifting stale.
import en from "../src/content/landing/en.json" with { type: "json" };
import de from "../src/content/landing/de.json" with { type: "json" };

test.describe("English home page", () => {
  test("renders hero, all sections, contact and footer", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Hero eyebrow + title
    await expect(
      page.locator("main").getByText(en.header.eyebrow),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: en.header.title, level: 1 }),
    ).toBeVisible();

    // Every section heading renders
    for (const heading of [
      en.offer.title,
      en.about.title,
      en.whoFor.title,
      en.situations.title,
      en.format.title,
    ]) {
      await expect(
        page.getByRole("heading", { name: heading }),
      ).toBeVisible();
    }

    // Inline SVG icons rendered for list items
    await expect(page.locator("svg.svg-icon").first()).toBeVisible();

    // CMS rich-text renders as real HTML (a <p> inside the prose container),
    // not as escaped text - guards the set:html rendering of hero/about.
    await expect(page.locator("#about .rich-text p").first()).toBeVisible();
    await expect(page.locator("main .rich-text p").first()).toBeVisible();

    // Hero and about images render (optimised by the Image component).
    // Asserted structurally (section + non-empty alt) rather than by exact
    // alt text, because the copy is CMS-owned and drifts with content edits.
    await expect(page.locator("main img").first()).toBeVisible();
    const aboutImg = page.locator("#about img");
    await expect(aboutImg).toBeVisible();
    await expect(aboutImg).toHaveAttribute("alt", /.+/);

    // Contact email link reveals its mailto only on user intent (gated).
    const emailLink = page.locator("a.js-email").first();
    await emailLink.focus();
    await expect(emailLink).toHaveAttribute(
			"href",
			"mailto:culturewithgen@gmail.com",
		);

    // Footer
    await expect(page.locator("footer")).toContainText("CultureWithGen");

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("German home page", () => {
  test("renders German hero and contact", async ({ page }) => {
    const response = await page.goto("/de/");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: de.header.title, level: 1 }),
    ).toBeVisible();

    const emailLink = page.locator("a.js-email").first();
    await emailLink.focus();
    await expect(emailLink).toHaveAttribute(
			"href",
			"mailto:culturewithgen@gmail.com",
		);
  });
});
