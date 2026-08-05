import { test, expect, type Page } from "@playwright/test";

// The hero intro animates these with `animation-fill-mode: both` and an
// `opacity: 0` start keyframe, so the content is genuinely invisible until the
// animation runs. `toBeVisible()` only checks the bounding box and would still
// pass at opacity 0, so assert the settled opacity explicitly.
const SELECTORS = [".hero-name", ".hero-eyebrow-text", ".eyebrow-globe"];

function settledOpacities(page: Page, selectors: string[]) {
  return page.evaluate(async (sels) => {
    const els = sels.map((s) => document.querySelector(s));
    const missing = sels.filter((_, i) => !els[i]);
    if (missing.length) throw new Error(`missing elements: ${missing}`);

    // Scoped per element on purpose: a bare document.getAnimations() would also
    // pick up the infinite `email-float`, whose `finished` promise never
    // resolves and would hang this call.
    await Promise.all(
      els.flatMap((el) => el!.getAnimations().map((a) => a.finished)),
    );

    return Object.fromEntries(
      sels.map((s, i) => [s, getComputedStyle(els[i]!).opacity]),
    );
  }, selectors);
}

test.describe("Hero intro animation", () => {
  for (const { path, label } of [
    { path: "/", label: "English" },
    { path: "/de/", label: "German" },
  ]) {
    test(`settles fully visible on the ${label} page`, async ({ page }) => {
      await page.goto(path);

      const opacities = await settledOpacities(page, SELECTORS);

      for (const selector of SELECTORS) {
        expect(opacities[selector], `${selector} settled opacity`).toBe("1");
      }
    });
  }
});
