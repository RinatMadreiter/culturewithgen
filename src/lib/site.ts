export const SITE_NAME = "CultureWithGen";

/** Fallback for `Astro.site`, which is typed as possibly-undefined. */
export const SITE_ORIGIN = "https://culturewithgen.com";

export const DEFAULT_OG_IMAGE = "/og-image.jpg";

export function absoluteUrl(path: string, site?: URL): string {
  if (path.startsWith("http")) return path;
  return new URL(path, site ?? new URL(SITE_ORIGIN)).href;
}
