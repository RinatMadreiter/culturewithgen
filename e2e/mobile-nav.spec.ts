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
});
