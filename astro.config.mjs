// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://culturewithgen.com',
  integrations: [
    sitemap({
      // Emit <xhtml:link rel="alternate" hreflang> pairs in the sitemap so
      // search engines treat the EN (/) and DE (/de/) pages as translations.
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          de: 'de',
        },
      },
    }),
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: {
      prefixDefaultLocale: false, // English stays at '/'
    }
  },

  build: {
    // The site's CSS is small; inlining removes the render-blocking
    // stylesheet request flagged by Lighthouse.
    inlineStylesheets: 'always'
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
