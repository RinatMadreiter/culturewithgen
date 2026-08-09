import { test, expect } from "@playwright/test";

// The CSP is generated at build time by integrations/csp.mjs, which hashes the
// inline scripts Astro emits. That is easy to get subtly wrong in either
// direction: too strict silently breaks the language switcher and back-to-top,
// too loose ('unsafe-inline') makes the policy pointless. These cover both.

const pages = ["/", "/de/", "/privacy", "/404.html"];

function cspOf(content: string | null) {
  const out: Record<string, string> = {};
  for (const part of (content ?? "").split(";")) {
    const [name, ...rest] = part.trim().split(/\s+/);
    if (name) out[name] = rest.join(" ");
  }
  return out;
}

for (const path of pages) {
  test(`CSP on ${path} is present and strict`, async ({ page }) => {
    await page.goto(path);
    const content = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute("content");

    expect(content, "CSP meta is missing").toBeTruthy();
    const csp = cspOf(content);

    expect(csp["default-src"]).toBe("'self'");
    expect(csp["object-src"]).toBe("'none'");
    expect(csp["base-uri"]).toBe("'none'");

    // The whole point: inline script must never be blanket-allowed.
    expect(csp["script-src"]).not.toContain("unsafe-inline");
    expect(csp["script-src"]).not.toContain("unsafe-eval");
    expect(csp["script-src"]).toContain("'self'");
  });
}

// A policy can be strict and still be wrong, by blocking the site's own code.
// Astro inlines the Navigation and BackToTop modules, so a missing hash shows
// up here as a violation rather than as a silently dead button.
test("no CSP violations are raised on either home page", async ({ page }) => {
  for (const path of ["/", "/de/"]) {
    const violations: string[] = [];
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        (window as unknown as { __csp: string[] }).__csp ??= [];
        (window as unknown as { __csp: string[] }).__csp.push(
          `${e.violatedDirective} blocked ${e.blockedURI}`,
        );
      });
    });
    page.on("console", (m) => {
      if (m.text().includes("Content Security Policy"))
        violations.push(m.text());
    });

    await page.goto(path);
    // Scroll so the IntersectionObserver and scroll handler in the inline
    // scripts actually run, rather than only asserting on a static page.
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(400);

    const reported = await page.evaluate(
      () => (window as unknown as { __csp?: string[] }).__csp ?? [],
    );
    expect([...violations, ...reported], `CSP violations on ${path}`).toEqual(
      [],
    );
  }
});

// Proves the hashed inline scripts really do still execute under the policy.
test("inline scripts still run under the CSP", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 2000));
  // BackToTop's inline script adds `is-visible` past its 600px threshold. If
  // the CSP hash were wrong the script would never run and this class would
  // never appear.
  await expect(page.locator("#back-to-top")).toHaveClass(/is-visible/, {
    timeout: 5000,
  });
});
