import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { closetOutfitItems, closetOutfits, wardrobeItems } from "@/db/schema";
import {
  OUTFIT_SLOT_ORDER,
  paletteOf,
  type ClosetFilter,
  type PaletteColor,
  type WardrobeCategory,
  WARDROBE_FAMILIES,
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
  createdAt: Date;
  items: ClosetItem[];
  palette: PaletteColor[];
}

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

async function hydrate(
  userId: string,
  rows: { id: string; name: string; season: Season; createdAt: Date }[],
): Promise<ClosetOutfitView[]> {
  if (rows.length === 0) return [];
  const links = await db
    .select({ outfitId: closetOutfitItems.outfitId, ...itemColumns })
    .from(closetOutfitItems)
    .innerJoin(wardrobeItems, eq(wardrobeItems.id, closetOutfitItems.itemId))
    .where(
      and(
        inArray(closetOutfitItems.outfitId, rows.map((r) => r.id)),
        eq(wardrobeItems.userId, userId),
      ),
    )
    .orderBy(asc(closetOutfitItems.category));

  const byOutfit = new Map<string, ClosetItem[]>();
  for (const { outfitId, ...item } of links) {
    const list = byOutfit.get(outfitId) ?? [];
    list.push(item);
    byOutfit.set(outfitId, list);
  }
  return rows.map((r) => {
    const items = (byOutfit.get(r.id) ?? []).sort(
      (a, b) => OUTFIT_SLOT_ORDER.indexOf(a.category) - OUTFIT_SLOT_ORDER.indexOf(b.category),
    );
    return { ...r, items, palette: paletteOf(items) };
  });
}

export async function listClosetOutfits(userId: string): Promise<ClosetOutfitView[]> {
  const rows = await db
    .select({ id: closetOutfits.id, name: closetOutfits.name, season: closetOutfits.season, createdAt: closetOutfits.createdAt })
    .from(closetOutfits)
    .where(eq(closetOutfits.userId, userId))
    .orderBy(desc(closetOutfits.createdAt));
  return hydrate(userId, rows);
}

export async function getClosetOutfit(userId: string, outfitId: string): Promise<ClosetOutfitView | null> {
  const rows = await db
    .select({ id: closetOutfits.id, name: closetOutfits.name, season: closetOutfits.season, createdAt: closetOutfits.createdAt })
    .from(closetOutfits)
    .where(and(eq(closetOutfits.id, outfitId), eq(closetOutfits.userId, userId)))
    .limit(1);
  const [view] = await hydrate(userId, rows);
  return view ?? null;
}

/** The user's saved closet outfits that include one specific item. */
export async function listOutfitsUsingItem(userId: string, itemId: string): Promise<ClosetOutfitView[]> {
  const rows = await db
    .select({ id: closetOutfits.id, name: closetOutfits.name, season: closetOutfits.season, createdAt: closetOutfits.createdAt })
    .from(closetOutfits)
    .innerJoin(closetOutfitItems, eq(closetOutfitItems.outfitId, closetOutfits.id))
    .where(and(eq(closetOutfits.userId, userId), eq(closetOutfitItems.itemId, itemId)))
    .orderBy(desc(closetOutfits.createdAt));
  return hydrate(userId, rows);
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
