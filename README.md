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
