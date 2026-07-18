import { test, expect } from "@playwright/test";

const legalPages = [
  {
    path: "/privacy",
    title: "Privacy policy",
    body: "General Data Protection Regulation (GDPR)",
    home: "/",
  },
  { path: "/imprint", title: "Imprint", body: "Genevieve Navisotschnig", home: "/" },
  {
    path: "/de/datenschutz",
    title: "Datenschutzerklärung",
    body: "Datenschutz-Grundverordnung (DSGVO)",
    home: "/de/",
  },
  { path: "/de/impressum", title: "Impressum", body: "Genevieve Navisotschnig", home: "/de/" },
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
