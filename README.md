# CultureWithGen

Bilingual (EN/DE) marketing site for an intercultural-communication trainer, built with [Astro](https://astro.build).

Content is managed with [Pages CMS](https://pagescms.org) - a git-based CMS. All content lives as files in this repository under `src/content/` and is read at build time through Astro Content Collections. There is no runtime CMS dependency.

## Content structure

- `src/content/landing/en.json`, `src/content/landing/de.json` - the landing page content for each language (hero, about, offer, who-for, situations, formats, contact).
- `src/content/legal/*.md` - legal pages. `privacy.md` / `imprint.md` are English (`/privacy`, `/imprint`); `de-datenschutz.md` / `de-impressum.md` are German (`/de/datenschutz`, `/de/impressum`).
- `public/images/` - uploaded media (referenced as `/images/...`).

The schema for all of the above is defined in `.pages.yml` (for the Pages CMS editing UI) and mirrored in `src/content.config.ts` (the Astro Content Collections Zod schema). Keep the two in sync when changing fields.

## Editing content with Pages CMS

Pages CMS edits the content files in this repo directly on GitHub through a hosted UI - no deployed site is required.

One-time setup:

1. Go to [app.pagescms.org](https://app.pagescms.org) and sign in with GitHub.
2. Install the Pages CMS GitHub app and grant it access to this repository.
3. Open the repository in Pages CMS - it reads `.pages.yml` and presents the editing UI.

Saved edits are committed back to the repo; rebuild/redeploy to publish them.

## Technical notes

- **Email obfuscation** - The `contact.email` content field is never written as plain text to the HTML.
`ObfuscatedEmail.astro` XOR-encodes the address at build time into a single opaque base64 token stored in a `data-cfe` attribute (no plaintext, no split user/domain).
The `mailto:` is only assembled in the browser on genuine user intent (`pointerdown`, `focus`, `touchstart`, `contextmenu`), so DOM-snapshot scrapers never see the address.
Visitors with JavaScript disabled see a readable `[at] / [dot]` fallback.
- **SEO** - Native SEO with no third-party SEO packages.
`Seo.astro` renders title, meta description, canonical, robots, hreflang alternates (EN/DE/x-default), Open Graph, and Twitter Card tags; all URLs are resolved to absolute against the configured `site`.
`StructuredData.astro` emits a JSON-LD graph (`WebSite` + `Person` + `ProfessionalService`) with `areaServed`, `availableLanguage`, and `makesOffer` items derived from the landing-page content.
Both components are applied to the EN and DE home pages; `LegalLayout.astro` applies `Seo.astro` (with `noindex=false` and cross-language hreflang) to all legal pages.
`public/og-image.jpg` (1200x630) is committed to `public/` and served as the Open Graph share image.
`public/robots.txt` allows all crawlers and references the sitemap index.
`@astrojs/sitemap` is configured with `i18n` so it emits `<xhtml:link rel="alternate" hreflang>` pairs in `sitemap-index.xml`.
- **Language-toggle scroll preservation** - The EN/DE links in the navigation track the most-visible page section via a scroll listener and rewrite their `href` to `/#section` / `/de/#section`, so switching language lands the user on the same section they were viewing.
- **Tailwind colors** - All design colors are written as explicit hex values (e.g. `bg-[#9A442D]`) rather than Tailwind theme tokens.
This is intentional: the Astro v4 + `@import tailwindcss` setup does not load `tailwind.config.mjs`, so theme-token aliases are unavailable at build time.

## 🧞 Commands

All commands are run from the root of the project (this repo uses **pnpm**):

| Command            | Action                                       |
| :----------------- | :------------------------------------------- |
| `pnpm install`     | Installs dependencies                        |
| `pnpm dev`         | Starts local dev server at `localhost:4321`  |
| `pnpm build`       | Build the production site to `./dist/`        |
| `pnpm preview`     | Preview the build locally                     |
| `pnpm test`        | Run the Playwright end-to-end tests           |
| `pnpm test:ui`     | Run the Playwright tests in UI mode           |
