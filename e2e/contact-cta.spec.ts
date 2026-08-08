import { test, expect } from "@playwright/test";

// Each language has its own Google Form.
const FORM_URL = {
  "/": "https://forms.gle/EjUHfZocCxnCVXs28",
  "/de/": "https://forms.gle/exDsX7n9q11Uk2v66",
} as const;

// The nav header, hero, and Contact-section "Contact Me" buttons all point at
// the external Google Form, opening in a new tab with the security rel.
for (const path of ["/", "/de/"] as const) {
  test.describe(`Contact CTAs on ${path}`, () => {
    test("links to the form from nav, hero and contact, in a new tab", async ({
      page,
    }) => {
      await page.goto(path);

      const formUrl = FORM_URL[path];
      const formLinks = page.locator(`a[href="${formUrl}"]`);
      // nav CTA + hero CTA + contact-section CTA.
      await expect(formLinks).toHaveCount(3);

      // Every form link opens in a new tab with the security rel.
      const count = await formLinks.count();
      for (let i = 0; i < count; i++) {
        await expect(formLinks.nth(i)).toHaveAttribute("target", "_blank");
        await expect(formLinks.nth(i)).toHaveAttribute("rel", /noopener/);
        await expect(formLinks.nth(i)).toHaveAttribute("rel", /noreferrer/);
      }

      // The two positionally-anchored ones are present by container.
      await expect(page.locator(`nav a[href="${formUrl}"]`)).toHaveCount(1);
      await expect(page.locator(`#contact a[href="${formUrl}"]`)).toHaveCount(
        1,
      );

      // The other language's form must never leak onto this page.
      const otherPath = path === "/" ? "/de/" : "/";
      await expect(
        page.locator(`a[href="${FORM_URL[otherPath]}"]`),
      ).toHaveCount(0);
    });

    test("no obfuscated email or mailto survives anywhere", async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator("a.js-email")).toHaveCount(0);
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    });
  });
}
