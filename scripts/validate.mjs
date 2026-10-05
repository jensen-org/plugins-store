// Validates entries/*.json against schema.json.
//
// Deliberately dependency-free: this script is the gate every plugin passes through, so pulling a
// validator from npm at CI time would put the whole ecosystem behind someone else's supply chain. It
// interprets only the keywords schema.json actually uses.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const schema = JSON.parse(readFileSync("schema.json", "utf8"));

function check(value, schema, path, errors) {
  if (schema.type === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${path}.${key} is required`);
    }
    for (const [key, sub] of Object.entries(value)) {
      const child = schema.properties?.[key];
      if (!child) {
        if (schema.additionalProperties === false) {
          errors.push(`${path}.${key} is not a known field`);
        }
        continue;
      }
      check(sub, child, `${path}.${key}`, errors);
    }
    return;
  }
  if (schema.type === "string") {
    if (typeof value !== "string") {
      errors.push(`${path} must be a string`);
      return;
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path} must not be empty`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path} does not match ${schema.pattern} (got ${JSON.stringify(value)})`);
    }
  }
}

const files = readdirSync("entries").filter((f) => f.endsWith(".json")).sort();
if (files.length === 0) {
  console.log("entries/ is empty: the catalog lists no plugins yet");
  process.exit(0);
}

const errors = [];
const seen = new Map();

for (const file of files) {
  const path = join("entries", file);
  let entry;
  try {
    entry = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    errors.push(`${path} is not valid JSON: ${err.message}`);
    continue;
  }
  check(entry, schema, path, errors);

  // The filename is the addressing key, so a mismatch would silently shadow another plugin.
  if (entry.id && file !== `${entry.id}.json`) {
    errors.push(`${path} declares id '${entry.id}'; the file must be named entries/${entry.id}.json`);
  }
  if (entry.id) {
    if (seen.has(entry.id)) errors.push(`${path} duplicates the id already claimed by ${seen.get(entry.id)}`);
    seen.set(entry.id, path);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}
console.log(`ok: ${files.length} ${files.length === 1 ? "entry" : "entries"} valid`);
