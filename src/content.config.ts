import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders'; // <-- 1. Import the new loader

const landingCollection = defineCollection({
  // 2. Remove "type: 'data'" and add the loader
  loader: glob({ pattern: '*.json', base: './src/content/landing' }),
  schema: z.object({
    header: z.object({
      title: z.string(),
      subtitle: z.string(),
      description: z.string()
    }),
    about: z.object({
      title: z.string(),
      paragraphs: z.array(z.string())
    }),
    offer: z.array(z.string()),
    whoFor: z.array(z.string()),
    situations: z.array(z.string()),
    format: z.array(z.string()),
    contact: z.object({
      text: z.string(),
      email: z.string(),
      location: z.string()
    })
  })
});

const legalCollection = defineCollection({
  // 3. Remove "type: 'content'" and add the loader for Markdown
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string()
  })
});

export const collections = {
  'landing': landingCollection,
  'legal': legalCollection,
};