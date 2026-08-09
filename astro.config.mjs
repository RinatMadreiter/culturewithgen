// @ts-check
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

import csp from "./integrations/csp.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://culturewithgen.com",
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          de: "de",
        },
      },
    }),
    // Must stay last: it hashes the inline scripts/styles in the final HTML.
    csp(),
  ],

  i18n: {
    defaultLocale: "en",
    locales: ["en", "de"],
    routing: {
      prefixDefaultLocale: false, // English stays at '/'
    },
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },

  build: {
    inlineStylesheets: "always",
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
