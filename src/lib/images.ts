import type { ImageMetadata } from "astro";
import type { z } from "astro/zod";
import type { imagePositionSchema, imageSchema } from "./content-schema";

/**
 * Which part of a photo to keep when it is cropped to a square/circle.
 * Inferred from the Zod schema rather than hand-written, so the type and the
 * validator cannot drift apart - adding a position to one without the other is
 * now a compile error instead of a silent runtime mismatch.
 */
export type ImagePosition = z.infer<typeof imagePositionSchema>;

/**
 * Full Tailwind class per position. Written out literally on purpose: Tailwind
 * only generates classes it can see as complete strings in source, so an
 * interpolated `object-${position}` would compile to no CSS at all.
 */
const OBJECT_POSITION_CLASS: Record<ImagePosition, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
  "left-top": "object-left-top",
  "right-top": "object-right-top",
  "left-bottom": "object-left-bottom",
  "right-bottom": "object-right-bottom",
};

/** Resolves a CMS position to its Tailwind class, defaulting to centre. */
export function objectPositionClass(position?: ImagePosition): string {
  return (position && OBJECT_POSITION_CLASS[position]) ?? "object-center";
}

/**
 * Shape of a CMS image field, inferred from the Zod schema so the two cannot
 * disagree. Every key is optional because every image field in .pages.yml is
 * optional - an editor can save alt text without picking a file.
 */
export type CmsImage = z.infer<typeof imageSchema>;

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
