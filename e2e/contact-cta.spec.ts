import { test, expect } from "@playwright/test";

const FORM_URL = "https://forms.gle/EjUHfZocCxnCVXs28";

// The nav header, hero, and Contact-section "Contact Me" buttons all point at
// the external Google Form, opening in a new tab with the security rel.
for (const path of ["/", "/de/"]) {
  test.describe(`Contact CTAs on ${path}`, () => {
    test("links to the form from nav, hero and contact, in a new tab", async ({
      page,
    }) => {
      await page.goto(path);

      const formLinks = page.locator(`a[href="${FORM_URL}"]`);
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
      await expect(page.locator(`nav a[href="${FORM_URL}"]`)).toHaveCount(1);
      await expect(page.locator(`#contact a[href="${FORM_URL}"]`)).toHaveCount(
        1,
      );
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
