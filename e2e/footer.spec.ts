import { test, expect } from "@playwright/test";

const EN = {
  privacy: "/privacy",
  imprint: "/imprint",
  linkedInLabel: "LinkedIn profile",
  tagline: "Intercultural Communication & Collaboration",
};
const DE = {
  privacy: "/de/datenschutz",
  imprint: "/de/impressum",
  linkedInLabel: "LinkedIn-Profil",
  tagline: "Interkulturelle Kommunikation & Zusammenarbeit",
};

// The footer renders on both home pages and all four legal pages. The legal
// pages deliberately do not load Tailwind, so covering them here is what proves
// the component's self-contained styling actually holds.
const pages = [
  { path: "/", label: "EN home", copy: EN },
  { path: "/de/", label: "DE home", copy: DE },
  { path: "/privacy", label: "EN privacy", copy: EN },
  { path: "/imprint", label: "EN imprint", copy: EN },
  { path: "/de/datenschutz", label: "DE privacy", copy: DE },
  { path: "/de/impressum", label: "DE imprint", copy: DE },
];

for (const { path, label, copy } of pages) {
  test.describe(`Footer on ${label}`, () => {
    test("renders the locale's links, tagline and LinkedIn", async ({
      page,
    }) => {
      await page.goto(path);

      const footer = page.locator("footer");
      await expect(footer).toBeVisible();
      await expect(footer).toContainText("CultureWithGen");
      await expect(footer).toContainText(copy.tagline);

      // The copyright line is assembled from a year, the brand and the tagline.
      // Asserted as a whole because the parts were once adjacent {..} expressions
      // and a formatter's newline between them rendered as "© 2026CultureWithGen"
      // - every individual substring above still passed.
      const year = new Date().getFullYear();
      await expect(footer.locator(".site-footer__copy")).toHaveText(
        `© ${year} CultureWithGen · ${copy.tagline}`,
      );

      await expect(footer.locator(`a[href="${copy.privacy}"]`)).toBeVisible();
      await expect(footer.locator(`a[href="${copy.imprint}"]`)).toBeVisible();

      const linkedIn = footer.locator('a[href*="linkedin"]');
      await expect(linkedIn).toBeVisible();
      await expect(linkedIn).toHaveAttribute("target", "_blank");
      await expect(linkedIn).toHaveAttribute("rel", /noopener/);
      await expect(linkedIn).toHaveAttribute("rel", /noreferrer/);
      await expect(linkedIn).toHaveAttribute("aria-label", copy.linkedInLabel);
    });

    // The component ships its own CSS so it must look right even where Tailwind
    // is absent. Bare browser defaults would give underlined blue links and a
    // transparent background, so assert the styling actually applied.
    test("applies its own styling without relying on Tailwind", async ({
      page,
    }) => {
      await page.goto(path);

      const styles = await page.evaluate(() => {
        const footer = document.querySelector("footer")!;
        const link = footer.querySelector("a")!;
        const copyLine = footer.querySelector("p")!;
        return {
          background: getComputedStyle(footer).backgroundColor,
          linkDecoration: getComputedStyle(link).textDecorationLine,
          copyMarginTop: getComputedStyle(copyLine).marginTop,
        };
      });

      expect(styles.background).toBe("rgb(16, 36, 32)");
      expect(styles.linkDecoration).toBe("none");
      expect(styles.copyMarginTop).toBe("0px");
    });

    // Desktop is where the old space-between split lived, so assert the
    // centred stack there specifically: LinkedIn above the legal links, above
    // the copyright, every row centred on the footer's axis.
    test("stacks its rows centred on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);

      const geo = await page.evaluate(() => {
        const footer = document.querySelector("footer")!;
        const centre = (el: Element) => {
          const r = el.getBoundingClientRect();
          return { cx: r.left + r.width / 2, y: r.top };
        };
        return {
          footerCx: centre(footer).cx,
          social: centre(footer.querySelector(".site-footer__social")!),
          legal: centre(footer.querySelector(".site-footer__legal")!),
          copy: centre(footer.querySelector("p")!),
        };
      });

      for (const [name, el] of Object.entries({
        social: geo.social,
        legal: geo.legal,
        copy: geo.copy,
      })) {
        expect(
          Math.abs(el.cx - geo.footerCx),
          `${name} is centred`,
        ).toBeLessThanOrEqual(1);
      }

      expect(geo.social.y, "LinkedIn above legal links").toBeLessThan(
        geo.legal.y,
      );
      expect(geo.legal.y, "legal links above copyright").toBeLessThan(
        geo.copy.y,
      );
    });

    // Regression guards for what the slim-down removed.
    test("does not duplicate the email or the logo", async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('footer a[href^="mailto:"]')).toHaveCount(0);
      await expect(page.locator("footer img")).toHaveCount(0);
    });

    test.describe("on mobile", () => {
      test.use({ viewport: { width: 375, height: 812 } });

      test("has adequate touch targets and no horizontal overflow", async ({
        page,
      }) => {
        await page.goto(path);

        const targets = [
          page.locator('footer a[href*="linkedin"]'),
          page.locator(`footer a[href="${copy.privacy}"]`),
          page.locator(`footer a[href="${copy.imprint}"]`),
        ];
        for (const target of targets) {
          const box = await target.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }

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

// Only the home pages have a Contact section; this is the separation the
// redesign was for.
for (const path of ["/", "/de/"]) {
  test(`footer is a visually distinct band from Contact on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const colors = await page.evaluate(() => ({
      footer: getComputedStyle(document.querySelector("footer")!)
        .backgroundColor,
      contact: getComputedStyle(document.querySelector("#contact")!)
        .backgroundColor,
    }));
    expect(colors.footer).not.toBe(colors.contact);
  });
}

// The imprint pages are short; without the sticky-footer layout the footer
// would float mid-viewport with page background showing beneath it.
for (const path of ["/imprint", "/de/impressum"]) {
  test(`footer sits at the bottom of the short page ${path}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await page.goto(path);
    const bottom = await page.evaluate(
      () => document.querySelector("footer")!.getBoundingClientRect().bottom,
    );
    expect(bottom).toBeGreaterThanOrEqual(1199);
  });
}
