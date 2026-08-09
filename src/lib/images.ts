import type { ImageMetadata } from "astro";
import type { z } from "astro/zod";
import type { imagePositionSchema, imageSchema } from "./content-schema";

export type ImagePosition = z.infer<typeof imagePositionSchema>;

/** Literal strings only: Tailwind never sees an interpolated `object-${x}`. */
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

export function objectPositionClass(position?: ImagePosition): string {
  return (position && OBJECT_POSITION_CLASS[position]) ?? "object-center";
}

export type CmsImage = z.infer<typeof imageSchema>;

const publicImages = import.meta.glob(
  "/public/images/*.{webp,jpg,jpeg,png,avif}",
);
const assets = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/images/*.{webp,jpg,jpeg,png,avif}",
  { eager: true },
);

/**
 * `undefined` means "render a plain <img src>": the file lives in public/ and
 * cannot go through astro:assets. Callers must handle that branch.
 */
export function resolveImage(src?: string): ImageMetadata | undefined {
  const filename = src?.split("/").pop();
  if (!filename) return undefined;

  const inPublic = `/public/images/${filename}` in publicImages;
  if (inPublic) return undefined;

  return assets[`/src/assets/images/${filename}`]?.default;
}
