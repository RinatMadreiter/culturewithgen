// @ts-check
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://culturewithgen.com",
  integrations: [
    sitemap({
      // Emit <xhtml:link rel="alternate" hreflang> pairs in the sitemap so
      // search engines treat the EN (/) and DE (/de/) pages as translations.
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          de: "de",
        },
      },
    }),
  ],

  i18n: {
    defaultLocale: "en",
    locales: ["en", "de"],
    routing: {
      prefixDefaultLocale: false, // English stays at '/'
    },
  },

  // Makes the EN<->DE switch and the legal links feel instant.
  // Deliberately "hover" rather than "viewport": the language switcher lives in
  // the always-visible fixed nav, so a viewport strategy would speculatively
  // download the other locale's full page (~75kB) for every visitor, and most
  // never switch. Hover/focus prefetches on actual intent instead.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },

  build: {
    // The site's CSS is small; inlining removes the render-blocking
    // stylesheet request flagged by Lighthouse.
    inlineStylesheets: "always",
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
