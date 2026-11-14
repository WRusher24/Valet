import "server-only";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { closetWearLogs, savedClosetOutfits, wardrobeItems } from "@/db/schema";
import {
  OUTFIT_SLOT_ORDER,
  WARDROBE_FAMILIES,
  paletteOf,
  type ClosetFilter,
  type PaletteColor,
  type WardrobeCategory,
  type WardrobeFamily,
} from "./closet";
import type { Season } from "./constants";

export interface ClosetItem {
  id: string;
  imageUrl: string;
  category: WardrobeCategory;
  subTypeName: string;
  colorFamily: WardrobeFamily;
  createdAt: Date;
}

export interface ClosetOutfitView {
  id: string;
  name: string;
  season: Season;
  notes: string | null;
  comboId: string | null;
  createdAt: Date;
  /** Pieces in head-to-toe display order. */
  items: ClosetItem[];
  palette: PaletteColor[];
  lastWorn: string | null;
}

export interface ClosetWearEntry {
  id: string;
  wornOn: string;
  outfit: ClosetOutfitView;
}

/** Column of `saved_closet_outfits` that holds each wardrobe category. */
export const OUTFIT_SLOT_COLUMN = {
  top: savedClosetOutfits.topId,
  bottom: savedClosetOutfits.bottomId,
  shoes: savedClosetOutfits.shoesId,
  outerwear: savedClosetOutfits.outerwearId,
  belt: savedClosetOutfits.beltId,
  watch: savedClosetOutfits.watchId,
  bracelet: savedClosetOutfits.braceletId,
} as const;

const itemColumns = {
  id: wardrobeItems.id,
  imageUrl: wardrobeItems.imageUrl,
  category: wardrobeItems.category,
  subTypeName: wardrobeItems.subTypeName,
  colorFamily: wardrobeItems.colorFamily,
  createdAt: wardrobeItems.createdAt,
};

/** Every query below filters on `user_id`, so one user can never see another user's closet. */
export async function listItems(
  userId: string,
  filter: ClosetFilter = "all",
  family: WardrobeFamily | null = null,
): Promise<ClosetItem[]> {
  return db
    .select(itemColumns)
    .from(wardrobeItems)
    .where(
      and(
        eq(wardrobeItems.userId, userId),
        filter === "all" ? undefined : eq(wardrobeItems.category, filter),
        family ? eq(wardrobeItems.colorFamily, family) : undefined,
      ),
    )
    .orderBy(desc(wardrobeItems.createdAt));
}

export async function getItem(userId: string, itemId: string): Promise<ClosetItem | null> {
  const [row] = await db
    .select(itemColumns)
    .from(wardrobeItems)
    .where(and(eq(wardrobeItems.id, itemId), eq(wardrobeItems.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function countItemsByCategory(userId: string): Promise<Record<WardrobeCategory | "all", number>> {
  const rows = await db
    .select({ category: wardrobeItems.category, n: sql<number>`count(*)::int` })
    .from(wardrobeItems)
    .where(eq(wardrobeItems.userId, userId))
    .groupBy(wardrobeItems.category);
  const counts: Record<WardrobeCategory | "all", number> = {
    all: 0, top: 0, bottom: 0, outerwear: 0, shoes: 0, belt: 0, watch: 0, bracelet: 0,
  };
  for (const r of rows) {
    counts[r.category] = r.n;
    counts.all += r.n;
  }
  return counts;
}

/** How many of the user's items sit in each colour family (drives the colour filter pills). */
export async function countItemsByFamily(userId: string): Promise<Record<WardrobeFamily | "all", number>> {
  const rows = await db
    .select({ family: wardrobeItems.colorFamily, n: sql<number>`count(*)::int` })
    .from(wardrobeItems)
    .where(eq(wardrobeItems.userId, userId))
    .groupBy(wardrobeItems.colorFamily);
  const counts = Object.fromEntries([["all", 0], ...WARDROBE_FAMILIES.map((f) => [f, 0])]) as Record<WardrobeFamily | "all", number>;
  for (const r of rows) {
    counts[r.family] = r.n;
    counts.all += r.n;
  }
  return counts;
}

type OutfitRow = typeof savedClosetOutfits.$inferSelect;

async function hydrate(userId: string, rows: OutfitRow[]): Promise<ClosetOutfitView[]> {
  if (rows.length === 0) return [];
  const itemIds = [
    ...new Set(
      rows.flatMap((r) =>
        [r.topId, r.bottomId, r.shoesId, r.outerwearId, r.beltId, r.watchId, r.braceletId].filter(
          (id): id is string => typeof id === "string",
        ),
      ),
    ),
  ];
  const [items, worn] = await Promise.all([
    db
      .select(itemColumns)
      .from(wardrobeItems)
      .where(and(eq(wardrobeItems.userId, userId), inArray(wardrobeItems.id, itemIds))),
    db
      .select({ outfitId: closetWearLogs.savedOutfitId, last: sql<string>`max(${closetWearLogs.wornOn})::text` })
      .from(closetWearLogs)
      .where(and(eq(closetWearLogs.userId, userId), inArray(closetWearLogs.savedOutfitId, rows.map((r) => r.id))))
      .groupBy(closetWearLogs.savedOutfitId),
  ]);
  const itemById = new Map(items.map((i) => [i.id, i]));
  const wornById = new Map(worn.map((w) => [w.outfitId, w.last]));

  return rows.map((r) => {
    const slotIds: Record<WardrobeCategory, string | null> = {
      top: r.topId,
      bottom: r.bottomId,
      shoes: r.shoesId,
      outerwear: r.outerwearId,
      belt: r.beltId,
      watch: r.watchId,
      bracelet: r.braceletId,
    };
    const pieces = OUTFIT_SLOT_ORDER.flatMap((c) => {
      const id = slotIds[c];
      const item = id ? itemById.get(id) : undefined;
      return item ? [item] : [];
    });
    const topName = itemById.get(r.topId)?.subTypeName ?? "Closet";
    return {
      id: r.id,
      name: r.name?.trim() || `${topName} look`,
      season: r.season,
      notes: r.notes,
      comboId: r.colorComboId,
      createdAt: r.createdAt,
      items: pieces,
      palette: paletteOf(pieces),
      lastWorn: wornById.get(r.id) ?? null,
    };
  });
}

export async function listClosetOutfits(userId: string): Promise<ClosetOutfitView[]> {
  const rows = await db
    .select()
    .from(savedClosetOutfits)
    .where(eq(savedClosetOutfits.userId, userId))
    .orderBy(desc(savedClosetOutfits.createdAt));
  return hydrate(userId, rows);
}

export async function getClosetOutfit(userId: string, outfitId: string): Promise<ClosetOutfitView | null> {
  const rows = await db
    .select()
    .from(savedClosetOutfits)
    .where(and(eq(savedClosetOutfits.id, outfitId), eq(savedClosetOutfits.userId, userId)))
    .limit(1);
  const [view] = await hydrate(userId, rows);
  return view ?? null;
}

/** The user's closet outfits built for one colour combination. */
export async function listClosetOutfitsForCombo(userId: string, comboId: string): Promise<ClosetOutfitView[]> {
  const rows = await db
    .select()
    .from(savedClosetOutfits)
    .where(and(eq(savedClosetOutfits.userId, userId), eq(savedClosetOutfits.colorComboId, comboId)))
    .orderBy(desc(savedClosetOutfits.createdAt));
  return hydrate(userId, rows);
}

/** The user's saved closet outfits that include one specific item (in any slot). */
export async function listOutfitsUsingItem(userId: string, itemId: string): Promise<ClosetOutfitView[]> {
  const rows = await db
    .select()
    .from(savedClosetOutfits)
    .where(
      and(
        eq(savedClosetOutfits.userId, userId),
        or(...Object.values(OUTFIT_SLOT_COLUMN).map((col) => eq(col, itemId))),
      ),
    )
    .orderBy(desc(savedClosetOutfits.createdAt));
  return hydrate(userId, rows);
}

/** Wear history for closet outfits, newest first. */
export async function listClosetWearHistory(userId: string): Promise<ClosetWearEntry[]> {
  const logs = await db
    .select({ id: closetWearLogs.id, wornOn: closetWearLogs.wornOn, outfitId: closetWearLogs.savedOutfitId })
    .from(closetWearLogs)
    .where(eq(closetWearLogs.userId, userId))
    .orderBy(desc(closetWearLogs.wornOn), desc(closetWearLogs.createdAt))
    .limit(200);
  if (logs.length === 0) return [];
  const rows = await db
    .select()
    .from(savedClosetOutfits)
    .where(and(eq(savedClosetOutfits.userId, userId), inArray(savedClosetOutfits.id, [...new Set(logs.map((l) => l.outfitId))])));
  const views = new Map((await hydrate(userId, rows)).map((v) => [v.id, v]));
  return logs.flatMap((l) => {
    const outfit = views.get(l.outfitId);
    return outfit ? [{ id: l.id, wornOn: l.wornOn, outfit }] : [];
  });
}
