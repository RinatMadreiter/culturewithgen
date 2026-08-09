// Zod schemas for the content collections, deliberately kept in a module that
// imports ONLY `astro/zod` - never `astro:content`. That virtual module only
// resolves inside an Astro build, so importing it here would make the schema
// unreachable from plain Node. scripts/check-cms-schema.mjs depends on being
// able to import this file directly to verify .pages.yml and Zod agree.
import { z } from "astro/zod";

/** Which part of a photo survives a square/circular crop. */
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

// Every key is optional on purpose. Every image field in .pages.yml is
// optional, so an editor can save alt text without picking a file, producing
// `{ "alt": "..." }` with no src. Requiring src here made that legal CMS input
// fail `astro check` and block the whole deploy for ~26 hours. Components
// already skip rendering when src is missing, so tolerating it degrades
// gracefully instead of taking the pipeline down over a content edit.
export const imageSchema = z.object({
  src: z.string().optional(),
  alt: z.string().optional(),
  position: imagePositionSchema.optional(),
});

/** Image as embedded in a section: the whole group may be absent. */
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
  // Optional SEO overrides for the search-engine title and snippet.
  // When omitted (or empty), the page falls back to values derived from
  // the on-page content - see src/pages/index.astro / de/index.astro.
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  // Optional wording overrides for the top-menu links. Every field is optional
  // and an empty string is treated as "not set", so clearing one in the CMS
  // falls back to the built-in label (src/lib/i18n.ts) rather than rendering a
  // blank link. The hrefs are not editable - they are section anchors.
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
    // Rich-text (HTML) authored via the CMS; rendered with set:html.
    description: z.string(),
    ctaLabel: z.string(),
    image,
  }),
  about: z.object({
    title: z.string(),
    // Rich-text (HTML) authored via the CMS; rendered with set:html.
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
  // Optional so neither locale JSON is forced to carry the key.
  testimonials: z
    .object({
      // CMS toggle to hide the whole section without deleting its content.
      // Defaults to visible when the key is absent.
      visible: z.boolean().default(true),
      title: z.string(),
      items: z.array(
        z.object({
          // Rich-text (HTML) authored via the CMS; rendered with set:html.
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
