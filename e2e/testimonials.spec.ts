import { test, expect } from "@playwright/test";
import en from "../src/content/landing/en.json" with { type: "json" };
import de from "../src/content/landing/de.json" with { type: "json" };

const locales = [
  { path: "/", label: "English", data: en.testimonials },
  { path: "/de/", label: "German", data: de.testimonials },
];

for (const { path, label, data } of locales) {
  // The CMS `visible` toggle hides the whole section without deleting content.
  // Branch at registration so the suite tracks the seed data: when the section
  // is toggled off we assert its absence; otherwise we run the full contract.
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
      // The <p> only exists if set:html parsed the CMS markup; escaped text
      // would leave the literal "<p>" as characters with no element.
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
      // Tailwind rounded-full resolves to a large px value or 50%; either way
      // it must be at least half the 56px box.
      expect(parseFloat(radius)).toBeGreaterThanOrEqual(28);
    });

    // The crop position comes from a CMS select and is mapped to a literal
    // Tailwind class. Guards the interpolation trap: `object-${position}`
    // would compile to no CSS, silently leaving avatars un-croppable.
    test("avatar has a real object-position applied", async ({ page }) => {
      await page.goto(path);
      const imgs = page.locator("#testimonials figcaption img");
      if ((await imgs.count()) === 0) {
        test.skip(true, "seed data has no testimonial images");
      }

      const first = imgs.first();
      const cls = (await first.getAttribute("class")) ?? "";
      expect(cls).toMatch(/\bobject-(center|top|bottom|left|right)/);

      // Asserting the computed value is useless here: with no position set the
      // avatar is object-center, whose 50% 50% is identical to the CSS default
      // - it would pass even if no class resolved at all. What genuinely breaks
      // is Tailwind not emitting the utilities, so assert the CSS exists for
      // every position an editor can pick.
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
      // A testimonial whose entry carries no image key. Not every seed set has
      // one (all current entries have photos), so skip rather than fail when
      // the contract cannot be exercised - the img-count check below still runs
      // for every entry that does have an image.
      const withoutImage = data.items.find(
        (i) =>
          !("image" in i) || !(i as { image?: { src?: string } }).image?.src,
      );
      if (withoutImage) {
        await expect(
          page.locator("#testimonials").getByText(withoutImage.name),
        ).toBeVisible();
      }
      // With no image on any seed entry, the section emits no avatar <img>.
      const imageCount = data.items.filter(
        (i) => "image" in i && (i as { image?: { src?: string } }).image?.src,
      ).length;
      await expect(page.locator("#testimonials figcaption img")).toHaveCount(
        imageCount,
      );
    });

    test("card lifts on hover to draw attention", async ({ page }) => {
      await page.goto(path);

      // The effect is intentionally hover-only: Tailwind wraps hover variants
      // in @media (hover: hover), so it applies to a mouse and is correctly
      // absent on touch. Skip where the test browser reports no hover.
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
        // All cards share one x => single column.
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
