import { test, expect } from "@playwright/test";

const legalPages = [
  { path: "/privacy", title: "Privacy policy", body: "Privacy policy text", home: "/" },
  { path: "/imprint", title: "Imprint", body: "impressum", home: "/" },
  { path: "/de/datenschutz", title: "Datenschutz", body: "Datenschutz Text", home: "/de/" },
  { path: "/de/impressum", title: "Impressum", body: "Impressums", home: "/de/" },
];

for (const { path, title, body, home } of legalPages) {
  test(`legal page ${path} renders header, title and body`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    // Header logo links back to the language home
    const logoLink = page.locator("header a.logo-link");
    await expect(logoLink).toHaveAttribute("href", home);
    await expect(logoLink.locator("img")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: title, level: 1 }),
    ).toBeVisible();
    await expect(page.locator("article.legal-prose")).toContainText(body);
  });
}
