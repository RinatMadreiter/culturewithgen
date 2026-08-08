import { test, expect } from "@playwright/test";
import en from "../src/content/landing/en.json" with { type: "json" };
import de from "../src/content/landing/de.json" with { type: "json" };

// Every image field in .pages.yml is optional, so the CMS can legitimately
// save `{"alt": "..."}` with no `src`. That once made `astro check` fail and
// blocked the deploy for a whole day. These guard the two halves of that bug:
// the data stays renderable, and the page degrades instead of breaking.
const locales = [
  { label: "English", path: "/", data: en },
  { label: "German", path: "/de/", data: de },
];

for (const { label, path, data } of locales) {
  test(`${label}: an image entry without src does not break the page`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    // Any testimonial whose image object exists but carries no usable src must
    // render its name and simply omit the avatar - never an empty/broken img.
    const items = data.testimonials?.items ?? [];
    const srcless = items.filter((i) => {
      const img = (i as { image?: { src?: string } }).image;
      return img !== undefined && !img.src;
    });

    for (const item of srcless) {
      await expect(
        page.locator("#testimonials").getByText(item.name),
      ).toBeVisible();
    }

    // No <img> may render without a real src (guards against src="" / broken).
    const emptySrc = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("img")).filter(
          (el) => !el.getAttribute("src"),
        ).length,
    );
    expect(emptySrc).toBe(0);

    expect(consoleErrors).toEqual([]);
  });
}
