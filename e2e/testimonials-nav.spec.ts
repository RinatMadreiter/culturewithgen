import { test, expect } from "@playwright/test";
import en from "../src/content/landing/en.json" with { type: "json" };
import de from "../src/content/landing/de.json" with { type: "json" };

// The Testimonials nav link is bound to the CMS `visible` toggle. These assert
// the binding against the seed data so the suite tracks the flag either way.
const locales = [
  { path: "/", label: "English", data: en.testimonials },
  { path: "/de/", label: "German", data: de.testimonials },
];

for (const { path, label, data } of locales) {
  const shown = !!data && data.visible !== false;

  test(`Testimonials nav link on ${label} follows the visible toggle (${shown ? "shown" : "hidden"})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(path);

    // Desktop bar: links live in the `hidden md:flex` container.
    const desktopLink = page
      .locator(".md\\:flex")
      .locator('a[href="#testimonials"]');
    await expect(desktopLink).toHaveCount(shown ? 1 : 0);
  });

  test(`Testimonials link in the mobile menu on ${label} follows the toggle (${shown ? "shown" : "hidden"})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path);
    await page.locator("#mobile-nav summary").click();
    const mobileLink = page.locator('#mobile-nav a[href="#testimonials"]');
    await expect(mobileLink).toHaveCount(shown ? 1 : 0);
  });
}
