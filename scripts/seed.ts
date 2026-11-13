import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { SEED_COMBOS } from "../src/db/seed-data";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL is not set — skipping seed.");
    return;
  }
  const db = drizzle(neon(url), { schema });
  const reset = process.argv.includes("--reset");

  if (reset) {
    const removed = await db.delete(schema.combos).where(isNull(schema.combos.userId)).returning({ id: schema.combos.id });
    console.log(`Reset: removed ${removed.length} curated combos (and their outfits).`);
  }

  let createdCombos = 0;
  let createdOutfits = 0;

  for (const combo of SEED_COMBOS) {
    const existing = await db.select({ id: schema.combos.id }).from(schema.combos).where(eq(schema.combos.slug, combo.slug)).limit(1);
    if (existing.length > 0) {
      console.log(`Skip   ${combo.slug} (already seeded)`);
      continue;
    }

    const comboId = randomUUID();
    const outfitRows = combo.outfits.map((o, index) => ({ id: randomUUID(), o, index }));

    // One atomic HTTP batch per combo.
    await db.batch([
      db.insert(schema.combos).values({
        id: comboId,
        slug: combo.slug,
        userId: null,
        title: combo.title,
        description: combo.description,
        season: combo.season,
      }),
      db.insert(schema.comboColors).values(
        combo.colors.map((color, position) => ({
          comboId,
          position,
          name: color.name,
          hex: color.hex,
          family: color.family,
        })),
      ),
      db.insert(schema.outfits).values(
        outfitRows.map(({ id, o, index }) => ({
          id,
          comboId,
          userId: null,
          title: o.title,
          style: o.style,
          season: o.season,
          imageUrl: o.imageUrl,
          sortOrder: index,
        })),
      ),
      db.insert(schema.outfitItems).values(
        outfitRows.flatMap(({ id, o }) =>
          o.items.map((item) => ({ outfitId: id, slot: item.slot, description: item.description, family: item.family })),
        ),
      ),
    ]);

    createdCombos += 1;
    createdOutfits += outfitRows.length;
    console.log(`Seeded ${combo.slug} (${outfitRows.length} outfits)`);
  }

  console.log(`Done. ${createdCombos} combos and ${createdOutfits} outfits created.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
