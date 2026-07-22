import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const image = z
  .object({
    src: z.string(),
    alt: z.string().optional(),
  })
  .optional();

const iconItem = z.object({
  icon: z.string(),
  text: z.string(),
});

const landingCollection = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/landing' }),
  schema: z.object({
    // Optional SEO overrides for the search-engine title and snippet.
    // When omitted (or empty), the page falls back to values derived from
    // the on-page content - see src/pages/index.astro / de/index.astro.
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
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
      items: z.array(iconItem),
    }),
    contact: z.object({
      title: z.string(),
      text: z.string(),
      email: z.string(),
      location: z.string(),
    }),
  }),
});

const legalCollection = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = {
  landing: landingCollection,
  legal: legalCollection,
};
