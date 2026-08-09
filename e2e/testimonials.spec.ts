import { test, expect } from "@playwright/test";
import en from "../src/content/landing/en.json" with { type: "json" };
import de from "../src/content/landing/de.json" with { type: "json" };

const locales = [
  { path: "/", label: "English", data: en.testimonials },
  { path: "/de/", label: "German", data: de.testimonials },
];

for (const { path, label, data } of locales) {
  // Branch at registration so the suite follows the CMS `visible` toggle.
  const hidden = data.visible === false;

  if (hidden) {
    test(`Testimonials (${label}) is hidden when the CMS toggle is off`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator("#testimonials")).toHaveCount(0);
    });
    continue;
  }

  test.describe(`Testimonials (${label})`, () => {
    test("renders the heading, every quote and every name", async ({
      page,
    }) => {
      await page.goto(path);
      const section = page.locator("#testimonials");
      await expect(section).toBeVisible();
      await expect(
        section.getByRole("heading", { name: data.title }),
      ).toBeVisible();

      for (const item of data.items) {
        await expect(section.getByText(item.name)).toBeVisible();
      }
    });

    test("renders the quote as real HTML, not escaped text", async ({
      page,
    }) => {
      await page.goto(path);
      // A real <p> exists only if set:html parsed; escaped text would not.
      await expect(
        page.locator("#testimonials blockquote.rich-text p").first(),
      ).toBeVisible();
    });

    test("shows a genuinely circular, undistorted avatar when present", async ({
      page,
    }) => {
      await page.goto(path);
      const imgs = page.locator("#testimonials figcaption img");
      const count = await imgs.count();
      if (count === 0) {
        test.skip(true, "seed data has no testimonial images");
      }
      const box = await imgs.first().boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBe(box!.height);
      const radius = await imgs
        .first()
        .evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
      // rounded-full is a large px value or 50%; either clears half of 56px.
      expect(parseFloat(radius)).toBeGreaterThanOrEqual(28);
    });

    // Guards the interpolation trap: `object-${x}` compiles to no CSS.
    test("avatar has a real object-position applied", async ({ page }) => {
      await page.goto(path);
      const imgs = page.locator("#testimonials figcaption img");
      if ((await imgs.count()) === 0) {
        test.skip(true, "seed data has no testimonial images");
      }

      const first = imgs.first();
      const cls = (await first.getAttribute("class")) ?? "";
      expect(cls).toMatch(/\bobject-(center|top|bottom|left|right)/);

      // Computed value is useless: object-center equals the CSS default, so it
      // would pass with no class at all. Assert the utilities were emitted.
      const missing = await page.evaluate(() => {
        let css = "";
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules)) css += rule.cssText;
          } catch {
            /* cross-origin sheet, skip */
          }
        }
        return [
          "object-center",
          "object-top",
          "object-bottom",
          "object-left",
          "object-right",
          "object-left-top",
          "object-right-top",
          "object-left-bottom",
          "object-right-bottom",
        ].filter((c) => !css.includes(c));
      });
      expect(missing, "object-position utilities absent from CSS").toEqual([]);
    });

    test("an imageless testimonial still renders its name and emits no img", async ({
      page,
    }) => {
      await page.goto(path);
      // Not every seed set has an imageless entry; skip rather than fail.
      const withoutImage = data.items.find(
        (i) =>
          !("image" in i) || !(i as { image?: { src?: string } }).image?.src,
      );
      if (withoutImage) {
        await expect(
          page.locator("#testimonials").getByText(withoutImage.name),
        ).toBeVisible();
      }
      const imageCount = data.items.filter(
        (i) => "image" in i && (i as { image?: { src?: string } }).image?.src,
      ).length;
      await expect(page.locator("#testimonials figcaption img")).toHaveCount(
        imageCount,
      );
    });

    test("card lifts on hover to draw attention", async ({ page }) => {
      await page.goto(path);

      // Hover-only by design (@media (hover:hover)); skip without hover.
      const canHover = await page.evaluate(
        () => matchMedia("(hover: hover)").matches,
      );
      test.skip(!canHover, "environment has no hover capability");

      const card = page.locator("#testimonials figure").first();
      // Tailwind v4 scales via the CSS `scale` property, not `transform`.
      const rest = await card.evaluate((el) => getComputedStyle(el).scale);
      expect(rest).toBe("none");

      await card.hover();
      await page.waitForTimeout(400); // outlast the 300ms transition
      const hovered = await card.evaluate((el) => getComputedStyle(el).scale);
      expect(hovered).not.toBe("none");
    });

    test.describe("on mobile", () => {
      test.use({ viewport: { width: 375, height: 812 } });

      test("stacks to one column with no horizontal overflow", async ({
        page,
      }) => {
        await page.goto(path);
        const cards = page.locator("#testimonials figure");
        const count = await cards.count();
        const xs = new Set<number>();
        for (let i = 0; i < count; i++) {
          const box = await cards.nth(i).boundingBox();
          xs.add(Math.round(box!.x));
        }
        expect(xs.size).toBe(1);

        const overflows = await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        );
        expect(overflows).toBe(false);
      });
    });
  });
}
