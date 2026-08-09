import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Injects a per-page Content-Security-Policy <meta> into the built HTML.
 *
 * A <meta> rather than a header because GitHub Pages serves static files and
 * cannot send custom headers. Note that `frame-ancestors` has no effect in
 * meta form.
 *
 * Astro inlines some module scripts into the HTML, so the policy carries a
 * hash for each inline script and style a page actually contains. That keeps
 * 'unsafe-inline' out of the policy while leaving the site's own code working.
 *
 * Runs on build only, so `astro dev` and its HMR are unaffected.
 */

const sha256 = (body) =>
  `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`;

/** Inline <script>/<style> bodies, i.e. those without a `src` attribute. */
function inlineBodies(html, tag) {
  const bodies = [];
  const re = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)</${tag}>`, "g");
  for (const [, attrs, body] of html.matchAll(re)) {
    if (/\ssrc\s*=/.test(attrs)) continue; // external file, covered by 'self'
    if (body.length > 0) bodies.push(body);
  }
  return bodies;
}

function buildPolicy(html) {
  // JSON-LD is included too: it is a <script> element, and some browsers
  // apply script-src to it regardless of its non-executable type.
  const scripts = inlineBodies(html, "script").map(sha256);
  const styles = inlineBodies(html, "style").map(sha256);

  return [
    "default-src 'self'",
    `script-src 'self' ${scripts.join(" ")}`.trim(),
    `style-src 'self' ${styles.join(" ")}`.trim(),
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    // The site has no <form>; the contact CTA is a link, which is navigation
    // and unaffected by this directive.
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join("; ");
}

/** A meta CSP only governs what follows it, so it must precede every script. */
function inject(html, policy) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
  // Placed after the charset declaration so that stays inside the first 1024
  // bytes, which is where the parser looks for it.
  const charset = html.match(/<meta charset=["'][^"']*["']\s*\/?>/i);
  if (charset) {
    const at = html.indexOf(charset[0]) + charset[0].length;
    return html.slice(0, at) + meta + html.slice(at);
  }
  return html.replace(/<head(\s[^>]*)?>/i, (m) => m + meta);
}

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith(".html")) found.push(path);
  }
  return found;
}

export default function csp() {
  return {
    name: "csp-meta",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const files = await htmlFiles(fileURLToPath(dir));
        for (const file of files) {
          const html = await readFile(file, "utf8");
          await writeFile(file, inject(html, buildPolicy(html)));
        }
        logger.info(`Injected CSP meta into ${files.length} page(s)`);
      },
    },
  };
}
