import { test, expect } from "@playwright/test";

test.describe("404 page", () => {
  test("an unknown route serves the custom, non-indexed 404", async ({
    page,
  }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);

    await expect(page.getByText("404", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Page not found/ }),
    ).toBeVisible();

    // A home link for each language.
    await expect(
      page.getByRole("link", { name: "Back to home" }),
    ).toHaveAttribute("href", "/");
    await expect(
      page.getByRole("link", { name: "Zur Startseite" }),
    ).toHaveAttribute("href", "/de/");

    // Must not be indexed by search engines.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
});
