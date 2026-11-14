// Copies the minimal set of @imgly/background-removal model + WASM assets into public/imgly so the
// browser loads everything from this site (no third-party CDN, no API key).
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@imgly", "background-removal-data", "dist");
const target = join(root, "public", "imgly");

/** "small" is the 8-bit quantised ISNet model (~44 MB); the SIMD build runs in every current browser. */
const KEEP = ["/models/small", "/onnxruntime-web/ort-wasm-simd.wasm"];

if (!existsSync(join(source, "resources.json"))) {
  console.error(
    "Missing @imgly/background-removal-data. Run `npm install` (it is a devDependency) before building.",
  );
  process.exit(1);
}

const all = JSON.parse(readFileSync(join(source, "resources.json"), "utf8"));
const manifest = {};
for (const key of KEEP) {
  if (!all[key]) {
    console.error(`Resource ${key} not found in resources.json.`);
    process.exit(1);
  }
  manifest[key] = all[key];
}

mkdirSync(target, { recursive: true });
let copied = 0;
for (const entry of Object.values(manifest)) {
  for (const chunk of entry.chunks) {
    const from = join(source, chunk.hash);
    const to = join(target, chunk.hash);
    if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
    copyFileSync(from, to);
    copied += 1;
  }
}
writeFileSync(join(target, "resources.json"), JSON.stringify(manifest));
console.log(`imgly assets ready in public/imgly (${copied} file${copied === 1 ? "" : "s"} copied).`);
