// Builds index.json, the single file Jensen fetches, from entries/.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const plugins = readdirSync("entries")
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(readFileSync(join("entries", f), "utf8")))
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync("index.json", `${JSON.stringify({ plugins }, null, 2)}\n`);
console.log(`built index.json with ${plugins.length} ${plugins.length === 1 ? "plugin" : "plugins"}`);
