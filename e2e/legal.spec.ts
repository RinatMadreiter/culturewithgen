import { test, expect } from "@playwright/test";

const legalPages = [
  {
    path: "/privacy",
    title: "Privacy policy",
    body: "General Data Protection Regulation (GDPR)",
    home: "/",
  },
  {
    path: "/imprint",
    title: "Imprint",
    body: "Genevieve Navisotschnig",
    home: "/",
  },
  {
    path: "/de/datenschutz",
    title: "Datenschutzerklärung",
    body: "Datenschutz-Grundverordnung (DSGVO)",
    home: "/de/",
  },
  {
    path: "/de/impressum",
    title: "Impressum",
    body: "Genevieve Navisotschnig",
    home: "/de/",
  },
];

for (const { path, title, body, home } of legalPages) {
  test(`legal page ${path} renders header, title and body`, async ({
    page,
  }) => {
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

  // The legal header is styled independently of Navigation.astro (these pages
  // do not load Tailwind), so the two can silently drift apart. Compare them
  // directly against the home page rather than hard-coding pixel values. The
  // position check is what stops the logo jumping when navigating between them.
  for (const { width, height, viewport } of [
    { width: 1280, height: 900, viewport: "desktop" },
    { width: 375, height: 812, viewport: "mobile" },
  ]) {
    test(`legal page ${path} logo matches the home page nav on ${viewport}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });

      const read = async (url: string, selector: string) => {
        await page.goto(url);
        return page.evaluate((sel) => {
          const img = document.querySelector<HTMLImageElement>(sel)!;
          const rect = img.getBoundingClientRect();
          return {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            height: Math.round(rect.height),
            radius: getComputedStyle(img).borderTopLeftRadius,
            // Guards against an intrinsic size too small for the rendered
            // height, which would upscale and blur the logo.
            naturalHeight: img.naturalHeight,
          };
        }, selector);
      };

      const homeLogo = await read(home, "nav img");
      const legalLogo = await read(path, "header img");

      expect(legalLogo.height).toBe(homeLogo.height);
      expect(legalLogo.radius).toBe(homeLogo.radius);
      expect(legalLogo.naturalHeight).toBeGreaterThanOrEqual(legalLogo.height);

      // Same pixel position, so the mark does not shift between pages.
      expect(legalLogo.left).toBe(homeLogo.left);
      expect(legalLogo.top).toBe(homeLogo.top);
    });
  }
}
