import { test, expect } from "@playwright/test";

test.describe("Back to top button", () => {
  test("is hidden until scrolling past the hero, then scrolls to top on click", async ({
    page,
  }) => {
    await page.goto("/");
    const button = page.locator("#back-to-top");

    await expect(button).toBeAttached();
    await expect(button).not.toHaveClass(/is-visible/);

    await page.mouse.wheel(0, 800);
    await expect(button).toHaveClass(/is-visible/);

    await button.click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(50);
  });

  test("uses the English label on the English page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#back-to-top")).toHaveAttribute(
      "aria-label",
      "Back to top",
    );
  });

  test("uses the German label on the German page", async ({ page }) => {
    await page.goto("/de/");
    await expect(page.locator("#back-to-top")).toHaveAttribute(
      "aria-label",
      "Nach oben",
    );
  });
});
