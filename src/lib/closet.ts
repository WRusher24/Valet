import type { ColorFamily } from "./constants";

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

/** The 10 dedicated colour families stored on wardrobe items. */
export const WARDROBE_FAMILIES = [
  "browns_tan",
  "beige_khaki",
  "stone_sand",
  "blues",
  "greys",
  "greens",
  "whites_creams",
  "blacks",
  "burgundy_reds",
  "yellows_brights",
] as const;
export type WardrobeFamily = (typeof WARDROBE_FAMILIES)[number];

export function isWardrobeFamily(v: unknown): v is WardrobeFamily {
  return typeof v === "string" && (WARDROBE_FAMILIES as readonly string[]).includes(v);
}

export const WARDROBE_FAMILY_META: Record<
  WardrobeFamily,
  { label: string; hex: string; shades: string[]; lookbook: readonly ColorFamily[] }
> = {
  browns_tan: {
    label: "Browns & Tan",
    hex: "#8B5E3C",
    shades: ["Brown", "Tan", "Cognac", "Chocolate", "Espresso", "Taupe"],
    lookbook: ["browns"],
  },
  beige_khaki: {
    label: "Beige & Khaki",
    hex: "#D1BE98",
    shades: ["Beige", "Khaki"],
    lookbook: ["browns"],
  },
  stone_sand: {
    label: "Stone & Sand",
    hex: "#B9B09E",
    shades: ["Stone", "Sand", "Ecru"],
    lookbook: ["whites", "greys"],
  },
  blues: {
    label: "Blues",
    hex: "#2F4A75",
    shades: ["Navy", "Sky Blue", "Slate", "Chambray", "Cobalt", "Midnight"],
    lookbook: ["blues"],
  },
  greys: {
    label: "Greys",
    hex: "#8A8D91",
    shades: ["Charcoal", "Light Grey", "Heather", "Slate", "Pewter"],
    lookbook: ["greys"],
  },
  greens: {
    label: "Greens",
    hex: "#4F6B3F",
    shades: ["Olive", "Forest Green", "Sage", "Hunter", "Moss"],
    lookbook: ["greens"],
  },
  whites_creams: {
    label: "Whites & Creams",
    hex: "#F3EEE3",
    shades: ["Pure White", "Off-White", "Ivory"],
    lookbook: ["whites"],
  },
  blacks: {
    label: "Blacks",
    hex: "#111111",
    shades: ["Jet Black", "Washed Black", "Obsidian"],
    lookbook: ["blacks"],
  },
  burgundy_reds: {
    label: "Burgundy & Reds",
    hex: "#7A1F2B",
    shades: ["Burgundy", "Maroon", "Oxblood", "Rust", "Terracotta"],
    lookbook: ["reds"],
  },
  yellows_brights: {
    label: "Yellows & Brights",
    hex: "#E3B505",
    shades: ["Yellow", "Mustard", "Ochre", "vibrant accents"],
    lookbook: ["pastels"],
  },
};

/** Lookbook families a closet family corresponds to (stone & sand spans two lookbook groups). */
export function toLookbookFamilies(f: WardrobeFamily): readonly ColorFamily[] {
  return WARDROBE_FAMILY_META[f].lookbook;
}

export function familyLabel(f: WardrobeFamily): string {
  return WARDROBE_FAMILY_META[f].label;
}

export function familyHex(f: WardrobeFamily): string {
  return WARDROBE_FAMILY_META[f].hex;
}

export function familyShades(f: WardrobeFamily): string {
  return WARDROBE_FAMILY_META[f].shades.join(", ");
}

export function parseWardrobeFamilyFilter(v: string | string[] | undefined): WardrobeFamily | null {
  return isWardrobeFamily(v) ? v : null;
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
    out.push({ name: familyLabel(colorFamily), hex: familyHex(colorFamily), family: toLookbookFamilies(colorFamily)[0] ?? "greys" });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Colour harmony                                                      */
/* ------------------------------------------------------------------ */

/** Neutrals and earth tones pair with everything. */
const NEUTRALS: ReadonlySet<WardrobeFamily> = new Set(["blacks", "whites_creams", "greys", "beige_khaki", "stone_sand"]);

const PAIRINGS: readonly (readonly [WardrobeFamily, WardrobeFamily])[] = [
  ["browns_tan", "blues"],
  ["browns_tan", "greens"],
  ["browns_tan", "burgundy_reds"],
  ["browns_tan", "yellows_brights"],
  ["blues", "burgundy_reds"],
  ["blues", "yellows_brights"],
  ["greens", "yellows_brights"],
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
    else if ((famA === "browns_tan" || famA === "blacks") && (famB === "browns_tan" || famB === "blacks")) score -= 3;
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
