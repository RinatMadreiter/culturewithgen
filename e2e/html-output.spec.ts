import { test, expect } from "@playwright/test";

// Astro preserves `<!-- -->` in the built HTML, so a developer note written that
// way is served to every visitor. Eight of them were shipping ~1.2kB per page
// before they were removed. Use `{/* */}` in .astro instead - it is stripped.
const pages = [
  "/",
  "/de/",
  "/privacy",
  "/imprint",
  "/de/datenschutz",
  "/de/impressum",
  "/404.html",
];

for (const path of pages) {
  test(`no HTML comments are shipped on ${path}`, async ({ page }) => {
    await page.goto(path);
    const comments = await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.documentElement,
        NodeFilter.SHOW_COMMENT,
      );
      const found: string[] = [];
      while (walker.nextNode()) {
        found.push((walker.currentNode.nodeValue ?? "").trim().slice(0, 80));
      }
      return found;
    });
    expect(comments, `HTML comments served to visitors on ${path}`).toEqual([]);
  });
}
