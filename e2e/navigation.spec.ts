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
});
