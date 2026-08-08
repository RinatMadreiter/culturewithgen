import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
// Schemas live in src/lib/content-schema.ts so plain Node (and therefore
// scripts/check-cms-schema.mjs) can import them; this file keeps only the
// collection wiring, which does depend on the astro:content virtual module.
import { landingSchema, legalSchema } from "./lib/content-schema";

const landingCollection = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/landing" }),
  schema: landingSchema,
});

const legalCollection = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/legal" }),
  schema: legalSchema,
});

export const collections = {
  landing: landingCollection,
  legal: legalCollection,
};
