import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { closetOutfitItems, closetOutfits, wardrobeItems } from "@/db/schema";
import { CATEGORY_META, type WardrobeCategory } from "./closet";
import type { ClosetOutfitInput } from "./closet-schema";

export type CreateOutfitResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Creates a closet outfit after verifying that every referenced item belongs to
 * `userId` and sits in the matching category.
 */
export async function createClosetOutfit(userId: string, input: ClosetOutfitInput): Promise<CreateOutfitResult> {
  const slots = Object.entries(input.items).filter((e): e is [WardrobeCategory, string] => typeof e[1] === "string");
  const ids = slots.map(([, id]) => id);

  const owned = await db
    .select({ id: wardrobeItems.id, category: wardrobeItems.category, subTypeName: wardrobeItems.subTypeName })
    .from(wardrobeItems)
    .where(and(eq(wardrobeItems.userId, userId), inArray(wardrobeItems.id, ids)));
  const byId = new Map(owned.map((o) => [o.id, o]));

  for (const [category, id] of slots) {
    const item = byId.get(id);
    if (!item || item.category !== category) {
      return { ok: false, error: `Choose a valid ${CATEGORY_META[category].label.toLowerCase()} from your closet.` };
    }
  }

  const topName = byId.get(input.items.top)?.subTypeName ?? "Closet";
  const name = input.name?.trim() || `${topName} look`;
  const outfitId = randomUUID();

  await db.batch([
    db.insert(closetOutfits).values({ id: outfitId, userId, name, season: input.season }),
    db.insert(closetOutfitItems).values(slots.map(([category, itemId]) => ({ outfitId, category, itemId }))),
  ]);
  return { ok: true, id: outfitId };
}
