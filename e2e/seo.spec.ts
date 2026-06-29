import { test, expect } from "@playwright/test";

const ORIGIN = "https://culturewithgen.com";

test.describe("SEO - home pages", () => {
  test("English home exposes canonical, hreflang, OG, Twitter and JSON-LD", async ({
    page,
    request,
  }) => {
    await page.goto("/");

    // Title + description
    await expect(page).toHaveTitle(/Intercultural Communication.*CultureWithGen/);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /workshops/i);

    // Canonical + robots
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${ORIGIN}/`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /index, follow/,
    );

    // hreflang alternates (en, de, x-default)
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", `${ORIGIN}/`);
    await expect(
      page.locator('link[rel="alternate"][hreflang="de"]'),
    ).toHaveAttribute("href", `${ORIGIN}/de/`);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute("href", `${ORIGIN}/`);

    // Open Graph
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "website",
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      "en_GB",
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${ORIGIN}/`,
    );
    // og:image must be an absolute URL and actually resolve.
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toBe(`${ORIGIN}/og-image.jpg`);
    const imgRes = await request.get("/og-image.jpg");
    expect(imgRes.status()).toBe(200);

    // Twitter
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );

    // JSON-LD: valid, includes ProfessionalService, and never leaks the email.
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(ld).toBeTruthy();
    const data = JSON.parse(ld as string);
    const types = data["@graph"].map((n: { "@type": string }) => n["@type"]);
    expect(types).toContain("ProfessionalService");
    expect(types).toContain("Person");
    expect(ld).not.toContain("hello@example.com");
  });

  test("German home is correctly localized", async ({ page }) => {
    await page.goto("/de/");
    await expect(page).toHaveTitle(/Interkulturelle Kommunikation.*CultureWithGen/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${ORIGIN}/de/`,
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      "de_AT",
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute("href", `${ORIGIN}/`);
  });
});

test.describe("SEO - supporting files & legal", () => {
  test("robots.txt is served and references the sitemap", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Sitemap: https://culturewithgen.com/sitemap-index.xml");
  });

  test("legal pages carry canonical and cross-language hreflang", async ({
    page,
  }) => {
    await page.goto("/privacy");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${ORIGIN}/privacy`,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="de"]'),
    ).toHaveAttribute("href", `${ORIGIN}/de/datenschutz`);
  });
});
