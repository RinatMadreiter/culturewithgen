import { test, expect } from "@playwright/test";

test.describe("English home page", () => {
  test("renders hero, all sections, contact and footer", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Hero eyebrow + title
    await expect(
      page.locator("main").getByText("Intercultural Communication & Skills Training"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Better Communication Across Cultures at Work",
        level: 1,
      }),
    ).toBeVisible();

    // Every section heading renders
    for (const heading of [
      "What I offer",
      "About",
      "Who this is for",
      "Typical situations",
      "Format",
    ]) {
      await expect(
        page.getByRole("heading", { name: heading }),
      ).toBeVisible();
    }

    // Material Symbols icons rendered for list items
    await expect(page.locator(".material-symbols-outlined").first()).toBeVisible();

    // Hero and about images render (optimised by the Image component)
    await expect(
      page.getByAltText(/smiling outdoors among spring blossoms/i),
    ).toBeVisible();
    await expect(
      page.getByAltText("Portrait of Genevieve, intercultural communication trainer"),
    ).toBeVisible();

    // Contact email link reveals its mailto only on user intent (gated).
    const emailLink = page.locator("a.js-email").first();
    await emailLink.focus();
    await expect(emailLink).toHaveAttribute(
      "href",
      "mailto:hello@example.com",
    );

    // Footer
    await expect(page.locator("footer")).toContainText("CultureWithGen");

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("German home page", () => {
  test("renders German hero and contact", async ({ page }) => {
    const response = await page.goto("/de/");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", {
        name: "Bessere Kommunikation in internationalen Arbeitsumgebungen",
        level: 1,
      }),
    ).toBeVisible();

    const emailLink = page.locator("a.js-email").first();
    await emailLink.focus();
    await expect(emailLink).toHaveAttribute(
      "href",
      "mailto:hello@example.com",
    );
  });
});
