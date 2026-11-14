import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { combos, savedClosetOutfits, wardrobeItems } from "@/db/schema";
import { CATEGORY_META, type WardrobeCategory } from "./closet";
import type { ClosetOutfitInput } from "./closet-schema";

export type CreateOutfitResult = { ok: true; id: string; comboId: string | null } | { ok: false; error: string };

/**
 * Creates a saved closet outfit after verifying that every referenced item belongs to
 * `userId` and sits in the matching category, and that the optional colour combination
 * is one the user is allowed to see (starter library or their own).
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

  let comboId: string | null = null;
  if (input.comboId) {
    const [combo] = await db
      .select({ id: combos.id })
      .from(combos)
      .where(and(eq(combos.id, input.comboId), or(isNull(combos.userId), eq(combos.userId, userId))))
      .limit(1);
    if (!combo) return { ok: false, error: "That colour combination could not be found." };
    comboId = combo.id;
  }

  const id = randomUUID();
  await db.insert(savedClosetOutfits).values({
    id,
    userId,
    colorComboId: comboId,
    name: input.name?.trim() || null,
    topId: input.items.top,
    bottomId: input.items.bottom,
    shoesId: input.items.shoes,
    outerwearId: input.items.outerwear ?? null,
    beltId: input.items.belt ?? null,
    watchId: input.items.watch ?? null,
    braceletId: input.items.bracelet ?? null,
    season: input.season,
    notes: input.notes?.trim() || null,
  });
  return { ok: true, id, comboId };
}
