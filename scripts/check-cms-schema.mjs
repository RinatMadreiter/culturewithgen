/**
 * Guards against CMS <-> Zod schema drift.
 *
 * Three schemas must agree: .pages.yml (what the CMS lets an editor save),
 * the Zod schema (what the build validates), and the TS types (what components
 * consume). TS is inferred from Zod so those two cannot drift. This script
 * covers the remaining pair: .pages.yml vs Zod.
 *
 * Drift here has caused two outages, most recently 11 failed deploys over ~26h
 * when .pages.yml marked image `src` optional while Zod required it - the CMS
 * produced `{"alt": "..."}` and the build rejected its own CMS's output.
 *
 * Runs in CI (`pnpm check:schema`) because the Playwright suite does not.
 *
 * Scoped to the `landing` collection: the `legal` collection's `body` is
 * markdown content rather than frontmatter data, so comparing it to the Zod
 * schema would be a guaranteed false positive.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import { landingSchema } from "../src/lib/content-schema.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COLLECTION = "landing";

/** A field is optional unless explicitly marked required in .pages.yml. */
const isRequired = (field) => field.required === true;

/** Synthetic but schema-plausible value for each Pages CMS field type. */
function sampleValue(field) {
  switch (field.type) {
    case "object":
      return buildFull(field.fields ?? []);
    case "rich-text":
      return "<p>x</p>";
    case "image":
      return "/images/x.webp";
    case "select":
      return field.options?.values?.[0] ?? "x";
    case "boolean":
      return true;
    case "number":
      return 1;
    default:
      return "x";
  }
}

/** Fully populated object for a field list - every field present. */
function buildFull(fields) {
  const out = {};
  for (const field of fields) {
    const value = sampleValue(field);
    out[field.name] = field.list === true ? [value] : value;
  }
  return out;
}

/**
 * How the CMS actually represents an untouched optional field. This is modelled
 * on observed behaviour, not on `required` alone - treating every optional
 * field as omittable produces ~20 false positives, because Pages CMS writes an
 * empty string for a cleared text field rather than dropping the key.
 *
 *  - "omit"   the key disappears entirely. Observed for `type: image` (the real
 *             outage: `{"alt": "..."}` with no `src`) and for optional groups.
 *  - "empty"  the key stays with an empty value - `""` for text-like fields,
 *             `[]` for lists.
 *  - null     the CMS guarantees a value; nothing to probe.
 */
function untouchedForm(field, depth) {
  if (isRequired(field)) return null;
  if (field.list === true) return "empty"; // renders as []
  switch (field.type) {
    // A file picker left unset drops the key entirely - this is the exact
    // shape of the 7 Aug outage: `{"alt": "..."}` with no `src`.
    case "image":
      return "omit";
    // A nested group the editor never opened is absent (e.g. a testimonial
    // with no photo). Top-level sections are excluded: the CMS form always
    // renders and writes them, and Zod requiring them is correct - a landing
    // page with no `contact` is broken, not a schema disagreement.
    case "object":
      return depth > 0 ? "omit" : null;
    case "string":
    case "text":
    case "rich-text":
      return "empty"; // renders as ""
    // Not probed: `select` and `boolean` always carry a value once their
    // parent item exists, and `number` has no safe empty form. A select left
    // genuinely blank is a data-completeness problem, not schema drift.
    default:
      return null;
  }
}

/** Probes to run: each is a field path plus how the CMS leaves it untouched. */
function probes(fields, prefix = [], depth = 0) {
  const found = [];
  for (const field of fields) {
    const here = [...prefix, field.name];
    const form = untouchedForm(field, depth);
    if (form) found.push({ path: here, form });
    if (field.type === "object" && field.fields) {
      const inner = field.list === true ? [...here, 0] : here;
      found.push(...probes(field.fields, inner, depth + 1));
    }
  }
  return found;
}

/** Rewrites one path to how the CMS leaves it untouched: omitted or emptied. */
function applyUntouched(obj, path, form) {
  const clone = structuredClone(obj);
  let node = clone;
  for (const key of path.slice(0, -1)) {
    if (node == null) return clone;
    node = node[key];
  }
  if (node == null) return clone;
  const leaf = path.at(-1);
  if (form === "omit") {
    delete node[leaf];
  } else {
    node[leaf] = Array.isArray(node[leaf]) ? [] : "";
  }
  return clone;
}

/** Key paths present in `input` but dropped from `parsed` (Zod strips unknowns). */
function strippedKeys(input, parsed, prefix = []) {
  if (Array.isArray(input)) {
    return Array.isArray(parsed) && parsed.length
      ? strippedKeys(input[0], parsed[0], [...prefix, 0])
      : [];
  }
  if (input === null || typeof input !== "object") return [];
  const missing = [];
  for (const [key, value] of Object.entries(input)) {
    if (parsed === null || typeof parsed !== "object" || !(key in parsed)) {
      missing.push([...prefix, key].join("."));
      continue;
    }
    missing.push(...strippedKeys(value, parsed[key], [...prefix, key]));
  }
  return missing;
}

// ---------------------------------------------------------------------------

const config = parse(readFileSync(join(root, ".pages.yml"), "utf8"));
const collection = config.content.find((c) => c.name === COLLECTION);
if (!collection) {
  console.error(`FAIL: no "${COLLECTION}" collection in .pages.yml`);
  process.exit(1);
}

const full = buildFull(collection.fields);
const failures = [];

// A) Whatever the CMS produces for an untouched optional field, Zod must
//    accept. Probed one field at a time against an otherwise-complete object:
//    most top-level sections lack `required: true` in .pages.yml yet are
//    required in Zod, so a naive "minimal object" would be {} and flag
//    false positives everywhere.
const allProbes = probes(collection.fields);
for (const { path, form } of allProbes) {
  const result = landingSchema.safeParse(applyUntouched(full, path, form));
  if (!result.success) {
    const label = path.filter((p) => p !== 0).join(".");
    const how = form === "omit" ? "left unset (key absent)" : "cleared (empty)";
    const why = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    failures.push(
      `"${label}" can be ${how} in the CMS, but Zod rejects that\n      -> ${why}`,
    );
  }
}

// B) Every field the CMS can write must exist in Zod. Zod strips unknown keys
//    silently, so a missing one would vanish with no error at all.
const parsed = landingSchema.safeParse(full);
if (!parsed.success) {
  failures.push(
    `fully populated CMS object rejected by Zod:\n      -> ${parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")}`,
  );
} else {
  for (const key of strippedKeys(full, parsed.data)) {
    failures.push(
      `in .pages.yml but missing from Zod (silently dropped): "${key}"`,
    );
  }
}

if (failures.length) {
  console.error(
    `\n.pages.yml and the Zod schema disagree (${failures.length} issue(s)):\n`,
  );
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    "\nFix by aligning src/lib/content-schema.ts with .pages.yml.\n" +
      "Prefer making Zod tolerant: a content edit must never break the build.\n",
  );
  process.exit(1);
}

console.log(
  `check:schema - .pages.yml and Zod agree ` +
    `(${allProbes.length} optional field(s) probed).`,
);
