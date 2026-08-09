import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Injects a per-page CSP <meta> into the built HTML. A meta rather than a
 * header because static hosting cannot send headers; `frame-ancestors` is
 * therefore inert. Inline scripts are hashed, not blanket-allowed, so the
 * site's own inlined modules keep working. Build only, so dev/HMR is untouched.
 */

const sha256 = (body) =>
  `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`;

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
  // JSON-LD included: some browsers apply script-src to it despite its type.
  const scripts = inlineBodies(html, "script").map(sha256);
  const styles = inlineBodies(html, "style").map(sha256);

  return [
    "default-src 'self'",
    `script-src 'self' ${scripts.join(" ")}`.trim(),
    `style-src 'self' ${styles.join(" ")}`.trim(),
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    // No <form> anywhere; the contact CTA is a link, which this does not affect.
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
