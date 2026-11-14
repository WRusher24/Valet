import { FAMILY_META, type ColorFamily } from "./constants";

export const WARDROBE_CATEGORIES = ["top", "bottom", "outerwear", "shoes", "belt", "watch", "bracelet"] as const;
export type WardrobeCategory = (typeof WARDROBE_CATEGORIES)[number];

export const CATEGORY_META: Record<WardrobeCategory, { label: string; plural: string }> = {
  top: { label: "Top", plural: "Tops" },
  bottom: { label: "Bottom", plural: "Bottoms" },
  outerwear: { label: "Outerwear", plural: "Outerwear" },
  shoes: { label: "Shoes", plural: "Shoes" },
  belt: { label: "Belt", plural: "Belts" },
  watch: { label: "Watch", plural: "Watches" },
  bracelet: { label: "Bracelet", plural: "Bracelets" },
};

/** Slots every complete outfit must fill. Outerwear is optional. */
export const REQUIRED_CATEGORIES = ["top", "bottom", "shoes", "belt", "watch", "bracelet"] as const;
export type RequiredCategory = (typeof REQUIRED_CATEGORIES)[number];

/** Display order for an outfit, head to toe. */
export const OUTFIT_SLOT_ORDER = ["outerwear", "top", "bottom", "shoes", "belt", "watch", "bracelet"] as const satisfies readonly WardrobeCategory[];

export const CLOSET_FILTERS = [
  { value: "all", label: "All" },
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "belt", label: "Belts" },
  { value: "watch", label: "Watches" },
  { value: "bracelet", label: "Bracelets" },
] as const;
export type ClosetFilter = (typeof CLOSET_FILTERS)[number]["value"];

export function isWardrobeCategory(v: unknown): v is WardrobeCategory {
  return typeof v === "string" && (WARDROBE_CATEGORIES as readonly string[]).includes(v);
}

export function parseClosetFilter(v: string | string[] | undefined): ClosetFilter {
  return isWardrobeCategory(v) ? v : "all";
}

/** Colour families as stored on wardrobe items. */
export const WARDROBE_FAMILIES = [
  "browns",
  "blues",
  "greys",
  "greens",
  "whites_creams",
  "blacks",
  "burgundy_reds",
  "pastels_other",
] as const;
export type WardrobeFamily = (typeof WARDROBE_FAMILIES)[number];

export function isWardrobeFamily(v: unknown): v is WardrobeFamily {
  return typeof v === "string" && (WARDROBE_FAMILIES as readonly string[]).includes(v);
}

const TO_LOOKBOOK: Record<WardrobeFamily, ColorFamily> = {
  browns: "browns",
  blues: "blues",
  greys: "greys",
  greens: "greens",
  whites_creams: "whites",
  blacks: "blacks",
  burgundy_reds: "reds",
  pastels_other: "pastels",
};

/** Maps a closet colour family onto the lookbook's family vocabulary. */
export function toLookbookFamily(f: WardrobeFamily): ColorFamily {
  return TO_LOOKBOOK[f];
}

export function familyLabel(f: WardrobeFamily): string {
  return FAMILY_META[TO_LOOKBOOK[f]].label;
}

export function familyHex(f: WardrobeFamily): string {
  return FAMILY_META[TO_LOOKBOOK[f]].hex;
}

export interface PaletteColor {
  name: string;
  hex: string;
  family: ColorFamily;
}

/** Distinct colour families across the pieces of an outfit, as capsule-swatch colours. */
export function paletteOf(items: readonly { colorFamily: WardrobeFamily }[]): PaletteColor[] {
  const seen = new Set<WardrobeFamily>();
  const out: PaletteColor[] = [];
  for (const { colorFamily } of items) {
    if (seen.has(colorFamily)) continue;
    seen.add(colorFamily);
    out.push({ name: familyLabel(colorFamily), hex: familyHex(colorFamily), family: toLookbookFamily(colorFamily) });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Colour harmony                                                      */
/* ------------------------------------------------------------------ */

const NEUTRALS: ReadonlySet<WardrobeFamily> = new Set(["blacks", "whites_creams", "greys"]);

const PAIRINGS: readonly (readonly [WardrobeFamily, WardrobeFamily])[] = [
  ["browns", "blues"],
  ["browns", "greens"],
  ["browns", "burgundy_reds"],
  ["browns", "pastels_other"],
  ["blues", "burgundy_reds"],
  ["blues", "pastels_other"],
  ["greens", "pastels_other"],
];

const PAIR_SET: ReadonlySet<string> = new Set(PAIRINGS.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));

/** True when two broad families generally work together in one outfit. */
export function familiesCompatible(a: WardrobeFamily, b: WardrobeFamily): boolean {
  if (a === b) return true;
  if (NEUTRALS.has(a) || NEUTRALS.has(b)) return true;
  return PAIR_SET.has(`${a}|${b}`);
}

/** Pairing score between two chosen pieces (higher is better). */
export function pairScore(
  catA: WardrobeCategory,
  famA: WardrobeFamily,
  catB: WardrobeCategory,
  famB: WardrobeFamily,
): number {
  let score = familiesCompatible(famA, famB) ? 1 : -2;
  const isBeltShoes = (catA === "belt" && catB === "shoes") || (catA === "shoes" && catB === "belt");
  if (isBeltShoes) {
    // Classic rule: belt matches shoes.
    if (famA === famB) score += 3;
    else if ((famA === "browns" || famA === "blacks") && (famB === "browns" || famB === "blacks")) score -= 3;
  }
  return score;
}

/* ------------------------------------------------------------------ */
/* Smart shuffle                                                       */
/* ------------------------------------------------------------------ */

export interface PickableItem {
  id: string;
  category: WardrobeCategory;
  colorFamily: WardrobeFamily;
}

export interface SmartOutfit<T extends PickableItem> {
  picked: Partial<Record<WardrobeCategory, T>>;
  missing: RequiredCategory[];
}

const BUILD_ORDER: readonly WardrobeCategory[] = ["top", "bottom", "shoes", "belt", "watch", "bracelet", "outerwear"];

function randomItem<T>(list: readonly T[], rng: () => number): T | undefined {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}

/**
 * Builds one outfit from real inventory: a random top first, then every other slot picks
 * (at random) among the pieces that harmonise best with what is already chosen.
 */
export function buildSmartOutfit<T extends PickableItem>(
  items: readonly T[],
  options: { includeOuterwear: boolean; rng?: () => number },
): SmartOutfit<T> {
  const rng = options.rng ?? Math.random;
  const byCategory = new Map<WardrobeCategory, T[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const missing = REQUIRED_CATEGORIES.filter((c) => (byCategory.get(c)?.length ?? 0) === 0);
  const picked: Partial<Record<WardrobeCategory, T>> = {};

  for (const category of BUILD_ORDER) {
    if (category === "outerwear" && !options.includeOuterwear) continue;
    const candidates = byCategory.get(category) ?? [];
    if (candidates.length === 0) continue;

    const chosen = Object.values(picked);
    if (chosen.length === 0) {
      const first = randomItem(candidates, rng);
      if (first) picked[category] = first;
      continue;
    }
    const scored = candidates.map((c) => ({
      item: c,
      score: chosen.reduce((sum, p) => sum + pairScore(category, c.colorFamily, p.category, p.colorFamily), 0),
    }));
    const best = Math.max(...scored.map((s) => s.score));
    const pool = scored.filter((s) => s.score >= best - 1).map((s) => s.item);
    const pick = randomItem(pool, rng);
    if (pick) picked[category] = pick;
  }

  return { picked, missing };
}
