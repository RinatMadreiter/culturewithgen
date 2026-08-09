/**
 * Site-wide constants and URL helpers.
 *
 * These were previously restated in every file that needed them - SITE_NAME in
 * five places, the origin fallback and the `abs()` helper in two each - so a
 * change had to be made consistently by hand. One definition each, here.
 */

/** Brand name used in <title>, og:site_name, JSON-LD and the footer. */
export const SITE_NAME = "CultureWithGen";

/**
 * Fallback for `Astro.site` (set via `site` in astro.config.mjs). Astro.site is
 * typed as possibly-undefined, so a literal is needed to keep URL building
 * total rather than sprinkling non-null assertions.
 */
export const SITE_ORIGIN = "https://culturewithgen.com";

/** Default social share card, used when a page supplies no image of its own. */
export const DEFAULT_OG_IMAGE = "/og-image.jpg";

/**
 * Resolves a path to an absolute URL, passing through anything already
 * absolute. Pass `Astro.site` so a preview or staging origin is respected.
 */
export function absoluteUrl(path: string, site?: URL): string {
  if (path.startsWith("http")) return path;
  return new URL(path, site ?? new URL(SITE_ORIGIN)).href;
}
