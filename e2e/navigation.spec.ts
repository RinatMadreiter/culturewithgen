import { test, expect } from "@playwright/test";

test.describe("Language switching", () => {
  test("navigates from English home to German home and back", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .locator("nav")
      .getByRole("link", { name: "DE", exact: true })
      .click();
    await expect(page).toHaveURL(/\/de\//);
    await expect(
      page.getByRole("heading", {
        name: "Bessere Kommunikation in internationalen Arbeitsumgebungen",
        level: 1,
      }),
    ).toBeVisible();

    await page
      .locator("nav")
      .getByRole("link", { name: "EN", exact: true })
      .click();
    await expect(page).toHaveURL(/^http:\/\/[^/]+\/?(?:#[\w-]+)?$/);
    await expect(
      page.getByRole("heading", {
        name: "Better Communication Across Cultures at Work",
        level: 1,
      }),
    ).toBeVisible();
  });

  test("in-page Workshops anchor points to the formats section", async ({
    page,
  }) => {
    await page.goto("/");
    const workshops = page
      .locator("nav")
      .getByRole("link", { name: "Workshops" });
    await expect(workshops).toHaveAttribute("href", "#formats");
    await expect(page.locator("#formats")).toBeAttached();
  });

  // The language links follow the section in view, so switching language keeps
  // the reader in place. Tracked with IntersectionObserver (it replaced a
  // per-scroll getBoundingClientRect loop), hence this behavioural guard.
  test("language links follow the section currently in view", async ({
    page,
  }) => {
    await page.goto("/");
    const en = page.locator("nav a.js-lang-en").first();
    const de = page.locator("nav a.js-lang-de").first();

    // Before scrolling they point at the plain home pages.
    await expect(en).toHaveAttribute("href", "/");
    await expect(de).toHaveAttribute("href", "/de/");

    for (const id of ["formats", "contact"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expect(en).toHaveAttribute("href", `/#${id}`);
      await expect(de).toHaveAttribute("href", `/de/#${id}`);
    }
  });
});
