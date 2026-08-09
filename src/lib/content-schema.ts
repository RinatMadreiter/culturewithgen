// Imports `astro/zod` only, never `astro:content`: that virtual module resolves
// only inside an Astro build, and scripts/check-cms-schema.mjs imports this file
// from plain Node.
import { z } from "astro/zod";

export const imagePositionSchema = z.enum([
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "left-top",
  "right-top",
  "left-bottom",
  "right-bottom",
]);

// All keys optional: the CMS can save alt text with no file, and rejecting that
// legal input would block the deploy over a content edit.
export const imageSchema = z.object({
  src: z.string().optional(),
  alt: z.string().optional(),
  position: imagePositionSchema.optional(),
});

const image = imageSchema.optional();

const iconItem = z.object({
  icon: z.string(),
  text: z.string(),
});

const formatItem = z.object({
  icon: z.string(),
  text: z.string(),
  description: z.string().optional(),
});

export const landingSchema = z.object({
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  // Blank overrides fall back to the i18n.ts labels, never an empty link.
  nav: z
    .object({
      services: z.string().optional(),
      about: z.string().optional(),
      workshops: z.string().optional(),
      testimonials: z.string().optional(),
    })
    .optional(),
  header: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    ctaLabel: z.string(),
    image,
  }),
  about: z.object({
    title: z.string(),
    body: z.string(),
    image,
    credentials: z.array(iconItem).default([]),
  }),
  offer: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    items: z.array(iconItem),
  }),
  whoFor: z.object({
    title: z.string(),
    items: z.array(iconItem),
  }),
  situations: z.object({
    title: z.string(),
    items: z.array(iconItem),
  }),
  format: z.object({
    title: z.string(),
    items: z.array(formatItem),
  }),
  testimonials: z
    .object({
      visible: z.boolean().default(true),
      title: z.string(),
      items: z.array(
        z.object({
          quote: z.string(),
          name: z.string(),
          image,
        }),
      ),
    })
    .optional(),
  contact: z.object({
    title: z.string(),
    text: z.string(),
    location: z.string(),
  }),
});

export const legalSchema = z.object({
  title: z.string(),
});
