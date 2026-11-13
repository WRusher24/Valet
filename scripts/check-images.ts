import { SEED_COMBOS } from "../src/db/seed-data";

/** Sends HEAD requests to every seeded photo and reports any that fail. */
async function main() {
  const urls = SEED_COMBOS.flatMap((c) => c.outfits.map((o) => ({ combo: c.slug, title: o.title, url: o.imageUrl })));
  let bad = 0;
  for (const { combo, title, url } of urls) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      bad += 1;
      console.log(`FAIL ${combo} / ${title}: ${(err as Error).message}\n     ${url}`);
    }
  }
  console.log(`${urls.length - bad}/${urls.length} photos reachable.`);
  process.exit(bad > 0 ? 1 : 0);
}

void main();
