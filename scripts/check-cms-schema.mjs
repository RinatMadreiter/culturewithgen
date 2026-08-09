/**
 * Three checks, run in CI as `pnpm check:schema`:
 *   A) anything the CMS can leave untouched, Zod must accept
 *   B) every field the CMS can write must exist in Zod (it strips unknowns)
 *   C) the JSON actually on disk must parse and validate
 *
 * Scoped to `landing`: the `legal` collection's body is markdown, not
 * frontmatter, so comparing it to Zod would always false-positive.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import { landingSchema } from "../src/lib/content-schema.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COLLECTION = "landing";

const isRequired = (field) => field.required === true;

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

function buildFull(fields) {
  const out = {};
  for (const field of fields) {
    const value = sampleValue(field);
    out[field.name] = field.list === true ? [value] : value;
  }
  return out;
}

/**
 * Observed CMS behaviour, not derivable from `required` alone - assuming every
 * optional field can simply be omitted produces ~20 false positives.
 *   "omit"  key disappears (image pickers, unopened nested groups)
 *   "empty" key stays as "" or []  (text-like fields, lists)
 *   null    always carries a value; nothing to probe
 */
function untouchedForm(field, depth) {
  if (isRequired(field)) return null;
  if (field.list === true) return "empty"; // renders as []
  switch (field.type) {
    case "image":
      return "omit";
    // Top-level sections excluded: the CMS always writes them, so Zod requiring
    // them is correct - a landing page with no `contact` is broken, not drift.
    case "object":
      return depth > 0 ? "omit" : null;
    case "string":
    case "text":
    case "rich-text":
      return "empty"; // renders as ""
    // select/boolean always carry a value; number has no safe empty form.
    default:
      return null;
  }
}

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

const config = parse(readFileSync(join(root, ".pages.yml"), "utf8"));
const collection = config.content.find((c) => c.name === COLLECTION);
if (!collection) {
  console.error(`FAIL: no "${COLLECTION}" collection in .pages.yml`);
  process.exit(1);
}

const full = buildFull(collection.fields);
const failures = [];

// A) One field at a time against a complete object: most top-level sections
//    are not `required: true` in .pages.yml but are required in Zod, so a
//    minimal object would be {} and false-positive everywhere.
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

// B) Zod strips unknown keys silently, so a field missing from it vanishes.
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

// C) A and B compare schemas to each other; neither looks at the JSON on disk,
//    where a truncated CMS write would pass both and fail later in the build.
const CONTENT_DIR = join(root, "src", "content", "landing");
const contentFailures = [];
const contentFiles = readdirSync(CONTENT_DIR).filter((f) =>
  f.endsWith(".json"),
);

if (contentFiles.length === 0) {
  contentFailures.push(`no .json content files found in ${CONTENT_DIR}`);
}

for (const file of contentFiles) {
  const path = join(CONTENT_DIR, file);
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    contentFailures.push(`${file} is not valid JSON\n      -> ${err.message}`);
    continue;
  }
  const result = landingSchema.safeParse(data);
  if (!result.success) {
    const why = result.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    contentFailures.push(
      `${file} does not satisfy the Zod schema\n      -> ${why}`,
    );
  }
}

if (contentFailures.length) {
  console.error(
    `\nContent in src/content/landing is invalid (${contentFailures.length} issue(s)):\n`,
  );
  for (const f of contentFailures) console.error(`  - ${f}`);
  console.error(
    "\nThis is the content itself, not the schema. A malformed CMS write\n" +
      "must be repaired in the JSON file before the site can build.\n",
  );
  process.exit(1);
}

console.log(
  `check:schema - .pages.yml and Zod agree ` +
    `(${allProbes.length} optional field(s) probed); ` +
    `${contentFiles.length} content file(s) valid.`,
);
