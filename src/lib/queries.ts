import "server-only";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { comboColors, combos, favorites, outfitItems, outfits, wearLogs } from "@/db/schema";
import type { ColorFamily, GarmentSlot, Season, SeasonFilter } from "./constants";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ColorView {
  name: string;
  hex: string;
  family: ColorFamily;
}

export interface ComboSummary {
  id: string;
  title: string;
  description: string | null;
  season: Season;
  isOwn: boolean;
  colors: ColorView[];
  outfitCount: number;
}

export interface OutfitItemView {
  slot: GarmentSlot;
  description: string;
  family: ColorFamily;
}

export interface OutfitView {
  id: string;
  comboId: string;
  comboTitle: string;
  comboColors: ColorView[];
  title: string;
  style: string;
  season: Season;
  imageUrl: string;
  isOwn: boolean;
  items: OutfitItemView[];
  favorited: boolean;
  lastWorn: string | null;
}

export interface WearEntry {
  id: string;
  wornOn: string;
  outfit: OutfitView;
}

const SLOT_ORDER: Record<GarmentSlot, number> = { layer: 0, top: 1, bottom: 2, shoes: 3 };

/** Visible = curated starter library OR owned by the current user. */
const comboVisible = (userId: string) => or(isNull(combos.userId), eq(combos.userId, userId));
const outfitVisible = (userId: string) => or(isNull(outfits.userId), eq(outfits.userId, userId));

async function colorsByCombo(comboIds: string[]): Promise<Map<string, ColorView[]>> {
  const map = new Map<string, ColorView[]>();
  if (comboIds.length === 0) return map;
  const rows = await db
    .select()
    .from(comboColors)
    .where(inArray(comboColors.comboId, comboIds))
    .orderBy(asc(comboColors.position));
  for (const r of rows) {
    const list = map.get(r.comboId) ?? [];
    list.push({ name: r.name, hex: r.hex, family: r.family });
    map.set(r.comboId, list);
  }
  return map;
}

function seasonClause(filter: SeasonFilter) {
  if (filter === "all") return undefined;
  return or(eq(combos.season, filter), eq(combos.season, "all_season"));
}

async function summarize(
  userId: string,
  rows: { id: string; title: string; description: string | null; season: Season; ownerId: string | null }[],
): Promise<ComboSummary[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [colorMap, counts] = await Promise.all([
    colorsByCombo(ids),
    db
      .select({ comboId: outfits.comboId, n: sql<number>`count(*)::int` })
      .from(outfits)
      .where(and(inArray(outfits.comboId, ids), outfitVisible(userId)))
      .groupBy(outfits.comboId),
  ]);
  const countMap = new Map(counts.map((c) => [c.comboId, c.n]));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    season: r.season,
    isOwn: r.ownerId === userId,
    colors: colorMap.get(r.id) ?? [],
    outfitCount: countMap.get(r.id) ?? 0,
  }));
}

const comboColumns = {
  id: combos.id,
  title: combos.title,
  description: combos.description,
  season: combos.season,
  ownerId: combos.userId,
};

export async function listCombos(userId: string, filter: SeasonFilter): Promise<ComboSummary[]> {
  const rows = await db
    .select(comboColumns)
    .from(combos)
    .where(and(comboVisible(userId), seasonClause(filter)))
    .orderBy(sql`(${combos.userId} is null)`, desc(combos.createdAt), asc(combos.title));
  return summarize(userId, rows);
}

export async function listOwnCombos(userId: string): Promise<ComboSummary[]> {
  const rows = await db
    .select(comboColumns)
    .from(combos)
    .where(eq(combos.userId, userId))
    .orderBy(desc(combos.createdAt));
  return summarize(userId, rows);
}

export async function listAllComboOptions(userId: string): Promise<{ id: string; title: string; isOwn: boolean }[]> {
  const rows = await db
    .select({ id: combos.id, title: combos.title, ownerId: combos.userId })
    .from(combos)
    .where(comboVisible(userId))
    .orderBy(sql`(${combos.userId} is null)`, asc(combos.title));
  return rows.map((r) => ({ id: r.id, title: r.title, isOwn: r.ownerId === userId }));
}

export async function getCombo(userId: string, comboId: string): Promise<ComboSummary | null> {
  if (!UUID_RE.test(comboId)) return null;
  const rows = await db
    .select(comboColumns)
    .from(combos)
    .where(and(eq(combos.id, comboId), comboVisible(userId)))
    .limit(1);
  const [summary] = await summarize(userId, rows);
  return summary ?? null;
}

export async function pickRandomComboId(userId: string, filter: SeasonFilter): Promise<string | null> {
  const [row] = await db
    .select({ id: combos.id })
    .from(combos)
    .where(and(comboVisible(userId), seasonClause(filter)))
    .orderBy(sql`random()`)
    .limit(1);
  return row?.id ?? null;
}

interface OutfitRow {
  id: string;
  comboId: string;
  comboTitle: string;
  title: string;
  style: string;
  season: Season;
  imageUrl: string;
  ownerId: string | null;
}

const outfitColumns = {
  id: outfits.id,
  comboId: outfits.comboId,
  comboTitle: combos.title,
  title: outfits.title,
  style: outfits.style,
  season: outfits.season,
  imageUrl: outfits.imageUrl,
  ownerId: outfits.userId,
};

async function hydrateOutfits(userId: string, rows: OutfitRow[]): Promise<OutfitView[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const comboIds = [...new Set(rows.map((r) => r.comboId))];
  const [items, favs, worn, colorMap] = await Promise.all([
    db.select().from(outfitItems).where(inArray(outfitItems.outfitId, ids)),
    db
      .select({ outfitId: favorites.outfitId })
      .from(favorites)
      .where(and(eq(favorites.userId, userId), inArray(favorites.outfitId, ids))),
    db
      .select({ outfitId: wearLogs.outfitId, last: sql<string>`max(${wearLogs.wornOn})::text` })
      .from(wearLogs)
      .where(and(eq(wearLogs.userId, userId), inArray(wearLogs.outfitId, ids)))
      .groupBy(wearLogs.outfitId),
    colorsByCombo(comboIds),
  ]);

  const itemMap = new Map<string, OutfitItemView[]>();
  for (const it of items) {
    const list = itemMap.get(it.outfitId) ?? [];
    list.push({ slot: it.slot, description: it.description, family: it.family });
    itemMap.set(it.outfitId, list);
  }
  const favSet = new Set(favs.map((f) => f.outfitId));
  const wornMap = new Map(worn.map((w) => [w.outfitId, w.last]));

  return rows.map((r) => ({
    id: r.id,
    comboId: r.comboId,
    comboTitle: r.comboTitle,
    comboColors: colorMap.get(r.comboId) ?? [],
    title: r.title,
    style: r.style,
    season: r.season,
    imageUrl: r.imageUrl,
    isOwn: r.ownerId === userId,
    items: (itemMap.get(r.id) ?? []).sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]),
    favorited: favSet.has(r.id),
    lastWorn: wornMap.get(r.id) ?? null,
  }));
}

export async function listOutfitsForCombo(userId: string, comboId: string): Promise<OutfitView[]> {
  const rows = await db
    .select(outfitColumns)
    .from(outfits)
    .innerJoin(combos, eq(combos.id, outfits.comboId))
    .where(and(eq(outfits.comboId, comboId), outfitVisible(userId)))
    .orderBy(sql`(${outfits.userId} is null)`, asc(outfits.sortOrder), asc(outfits.createdAt));
  return hydrateOutfits(userId, rows);
}

export async function lastWornForCombo(userId: string, comboId: string): Promise<string | null> {
  const [row] = await db
    .select({ last: sql<string | null>`max(${wearLogs.wornOn})::text` })
    .from(wearLogs)
    .where(and(eq(wearLogs.userId, userId), eq(wearLogs.comboId, comboId)));
  return row?.last ?? null;
}

export interface ItemFilterResult {
  combos: ComboSummary[];
  outfits: OutfitView[];
}

/** Outfits (and their combos) containing a garment in `slot` within a broad colour `family`. */
export async function filterByItem(
  userId: string,
  slot: GarmentSlot,
  family: ColorFamily,
): Promise<ItemFilterResult> {
  const matching = db
    .select({ id: outfitItems.outfitId })
    .from(outfitItems)
    .where(and(eq(outfitItems.slot, slot), eq(outfitItems.family, family)));

  const rows = await db
    .select(outfitColumns)
    .from(outfits)
    .innerJoin(combos, eq(combos.id, outfits.comboId))
    .where(and(inArray(outfits.id, matching), outfitVisible(userId), comboVisible(userId)))
    .orderBy(sql`(${outfits.userId} is null)`, asc(combos.title), asc(outfits.sortOrder));

  const outfitViews = await hydrateOutfits(userId, rows);
  const comboIds = [...new Set(rows.map((r) => r.comboId))];
  if (comboIds.length === 0) return { combos: [], outfits: outfitViews };

  const comboRows = await db
    .select(comboColumns)
    .from(combos)
    .where(inArray(combos.id, comboIds))
    .orderBy(asc(combos.title));
  return { combos: await summarize(userId, comboRows), outfits: outfitViews };
}

export async function listFavorites(userId: string): Promise<OutfitView[]> {
  const rows = await db
    .select(outfitColumns)
    .from(favorites)
    .innerJoin(outfits, eq(outfits.id, favorites.outfitId))
    .innerJoin(combos, eq(combos.id, outfits.comboId))
    .where(and(eq(favorites.userId, userId), outfitVisible(userId)))
    .orderBy(desc(favorites.createdAt));
  return hydrateOutfits(userId, rows);
}

export async function listWearHistory(userId: string): Promise<WearEntry[]> {
  const logs = await db
    .select({ id: wearLogs.id, wornOn: wearLogs.wornOn, outfitId: wearLogs.outfitId })
    .from(wearLogs)
    .where(eq(wearLogs.userId, userId))
    .orderBy(desc(wearLogs.wornOn), desc(wearLogs.createdAt))
    .limit(200);
  if (logs.length === 0) return [];
  const ids = [...new Set(logs.map((l) => l.outfitId))];
  const rows = await db
    .select(outfitColumns)
    .from(outfits)
    .innerJoin(combos, eq(combos.id, outfits.comboId))
    .where(and(inArray(outfits.id, ids), outfitVisible(userId)));
  const views = await hydrateOutfits(userId, rows);
  const byId = new Map(views.map((v) => [v.id, v]));
  return logs.flatMap((l) => {
    const outfit = byId.get(l.outfitId);
    return outfit ? [{ id: l.id, wornOn: l.wornOn, outfit }] : [];
  });
}
