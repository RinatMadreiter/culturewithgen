import { test, expect } from "@playwright/test";

// The nav exposes section links two ways: an inline row on >=md screens and a
// <details> hamburger disclosure on small screens. These guard both.
test.describe("Mobile navigation menu", () => {
  test("hamburger opens the section links and a tap closes it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const menu = page.locator("#mobile-nav");
    const summary = menu.locator("summary");
    const services = menu.getByRole("link", { name: "Services" });

    // Closed by default: the disclosure has no `open` attribute.
    await expect(menu).not.toHaveAttribute("open", /.*/);

    await summary.click();
    await expect(menu).toHaveAttribute("open", /.*/);
    await expect(services).toBeVisible();

    // Choosing a link collapses the menu and jumps to the section.
    await services.click();
    await expect(menu).not.toHaveAttribute("open", /.*/);
    await expect(page).toHaveURL(/#services$/);
  });

  test("hamburger is hidden and inline links show on desktop widths", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await expect(page.locator("#mobile-nav summary")).toBeHidden();
    // The inline links live in the `hidden md:flex` container, shown at >=md.
    await expect(
      page.locator(".md\\:flex").getByRole("link", { name: "Workshops" }),
    ).toBeVisible();
  });

  // Regression guard: the German CTA ("Kontakt aufnehmen") is far wider than
  // the English one, which once pushed the menu button past the right edge.
  // `body` has overflow-x:hidden, so the overflow clipped silently instead of
  // producing a scrollbar - the button was simply unreachable. Both locales
  // are checked because only /de/ was affected.
  for (const path of ["/", "/de/"]) {
    test(`menu button stays inside the mobile viewport on ${path}`, async ({
      page,
    }) => {
      const width = 375;
      await page.setViewportSize({ width, height: 812 });
      await page.goto(path);

      const summary = page.locator("#mobile-nav summary");
      const box = await summary.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);

      // Reachable in practice, not just positioned on screen.
      await summary.click();
      await expect(page.locator("#mobile-nav")).toHaveAttribute("open", /.*/);
    });
  }

  // The switcher renders twice (inline on desktop, in the menu on mobile).
  // On small screens only the in-menu copy should be reachable, and it must
  // clear the 24x24 minimum touch-target size.
  test("language switcher is inside the menu and adequately sized on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await page.locator("#mobile-nav summary").click();

    for (const sel of ["a.js-lang-en", "a.js-lang-de"]) {
      const link = page.locator(`#mobile-nav ${sel}`);
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
    }
  });
});
