// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import { storyblok } from '@storyblok/astro';

import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// The Storyblok Visual Editor loads the site in an HTTPS iframe, so the dev
// server must serve HTTPS. Only enable it for `astro dev`, never for builds.
const isDev = process.argv.includes('dev');

// Load .env into process.env (Node 20.12+/22+) so the token is available here.
try {
  process.loadEnvFile();
} catch {
  // .env is optional in CI where STORYBLOK_TOKEN is set in the environment.
}

// https://astro.build/config
export default defineConfig({
  site: 'https://culturewithgen.com',
  integrations: [
    storyblok({
      accessToken: process.env.STORYBLOK_TOKEN,
      bridge: true, // live click-to-edit inside the Visual Editor
      apiOptions: {
        region: 'eu',
      },
      components: {
        // root
        page: 'storyblok/Page',
        legal_page: 'storyblok/LegalPage',
        // sections
        hero: 'storyblok/Hero',
        about: 'storyblok/About',
        offer: 'storyblok/Offer',
        who_for: 'storyblok/WhoFor',
        situations: 'storyblok/Situations',
        formats: 'storyblok/Formats',
        contact: 'storyblok/Contact',
      },
    }),
    sitemap(),
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: {
      prefixDefaultLocale: false, // English stays at '/'
    }
  },

  vite: {
    plugins: [tailwindcss(), ...(isDev ? [basicSsl()] : [])]
  }
});