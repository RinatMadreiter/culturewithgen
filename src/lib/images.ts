import type { ImageMetadata } from "astro";

/**
 * Shape of a CMS image field. Both keys are optional because every image field
 * in .pages.yml is optional - an editor can save alt text without picking a
 * file. Mirrors the `image` schema in src/content.config.ts; keep them in sync.
 */
export interface CmsImage {
  src?: string;
  alt?: string;
}

// CMS uploads land in public/images/ and take precedence; src/assets/images/
// holds the committed originals and is used only when no public copy exists.
const publicImages = import.meta.glob(
  "/public/images/*.{webp,jpg,jpeg,png,avif}",
);
const assets = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/images/*.{webp,jpg,jpeg,png,avif}",
  { eager: true },
);

/**
 * Resolves a CMS image path to a build-optimisable asset.
 *
 * Returns `undefined` when the file is a CMS upload living in public/images/,
 * or when it simply is not found. Callers must treat `undefined` as "render a
 * plain <img src> instead" - public/ files are served as-is and cannot go
 * through astro:assets.
 */
export function resolveImage(src?: string): ImageMetadata | undefined {
  const filename = src?.split("/").pop();
  if (!filename) return undefined;

  const inPublic = `/public/images/${filename}` in publicImages;
  if (inPublic) return undefined;

  return assets[`/src/assets/images/${filename}`]?.default;
}
