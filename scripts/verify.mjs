// Fetches every entry's release manifest and proves the entry actually describes it.
//
// This is the check whose absence let the first catalog ship six entries pointing at repositories
// that were never created: every Install failed on its first fetch and nothing noticed.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MAX_BYTES = 1 << 20;

function releaseUrl(entry, asset) {
  return `https://github.com/${entry.repo}/releases/download/${entry.tag ?? entry.version}/${asset}`;
}

async function fetchAsset(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) return { ok: false, status: response.status };
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) return { ok: false, status: "too large" };
  return { ok: true, bytes };
}

const files = readdirSync("entries").filter((f) => f.endsWith(".json")).sort();
const failures = [];

for (const file of files) {
  const entry = JSON.parse(readFileSync(join("entries", file), "utf8"));
  const url = releaseUrl(entry, "manifest.json");
  const result = await fetchAsset(url);

  if (!result.ok) {
    failures.push(
      `${entry.id}: release manifest is unreachable (${result.status})\n    ${url}\n    ` +
        `check that the repository exists, is public, and has a release tagged '${entry.tag ?? entry.version}'`,
    );
    continue;
  }

  const digest = createHash("sha256").update(result.bytes).digest("hex");
  if (digest !== entry.sha256.toLowerCase()) {
    failures.push(
      `${entry.id}: sha256 does not match the published release\n    entry:   ${entry.sha256}\n    release: ${digest}\n    ` +
        `re-run 'jensen publish' and copy the checksum it prints`,
    );
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(new TextDecoder().decode(result.bytes));
  } catch (err) {
    failures.push(`${entry.id}: release manifest is not valid JSON: ${err.message}`);
    continue;
  }

  const before = failures.length;
  if (manifest.id !== entry.id) {
    failures.push(`${entry.id}: release manifest declares id '${manifest.id}'`);
  }
  if (manifest.version !== entry.version) {
    failures.push(
      `${entry.id}: entry says version ${entry.version}, release manifest says ${manifest.version}`,
    );
  }
  if (failures.length === before) {
    console.log(`ok: ${entry.id} ${entry.version} verified against ${entry.repo}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`error: ${failure}`);
  process.exit(1);
}
console.log(`ok: ${files.length} ${files.length === 1 ? "release" : "releases"} verified`);
