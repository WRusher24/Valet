export const SEASONS = ["summer", "winter", "all_season"] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_LABEL: Record<Season, string> = {
  summer: "Summer",
  winter: "Winter",
  all_season: "All-Season",
};

/** Seasons an individual outfit photo can be tagged with. */
export const OUTFIT_SEASONS = ["summer", "winter"] as const;

export const SEASON_FILTERS = [
  { value: "all", label: "All" },
  { value: "summer", label: "Summer / Warm Weather" },
  { value: "winter", label: "Winter / Cold Weather" },
] as const;
export type SeasonFilter = (typeof SEASON_FILTERS)[number]["value"];

export function parseSeasonFilter(value: string | string[] | undefined): SeasonFilter {
  return value === "summer" || value === "winter" ? value : "all";
}

export const COLOR_FAMILIES = [
  "browns",
  "blues",
  "greys",
  "greens",
  "whites",
  "blacks",
  "reds",
  "pastels",
] as const;
export type ColorFamily = (typeof COLOR_FAMILIES)[number];

export const FAMILY_META: Record<
  ColorFamily,
  { label: string; hex: string; shades: string[] }
> = {
  browns: {
    label: "Browns",
    hex: "#8B6B4A",
    shades: ["Camel", "Tan", "Cognac", "Chocolate", "Espresso", "Taupe", "Beige", "Khaki"],
  },
  blues: {
    label: "Blues",
    hex: "#2F4A75",
    shades: ["Navy", "Sky Blue", "Slate Blue", "Chambray", "Cobalt", "Midnight"],
  },
  greys: {
    label: "Greys",
    hex: "#8A8D91",
    shades: ["Charcoal", "Light Grey", "Heather", "Stone", "Pewter"],
  },
  greens: {
    label: "Greens",
    hex: "#4F6B3F",
    shades: ["Olive", "Forest Green", "Sage", "Hunter", "Moss"],
  },
  whites: {
    label: "Whites & Creams",
    hex: "#F3EEE3",
    shades: ["Pure White", "Off-White", "Ivory", "Ecru", "Sand"],
  },
  blacks: {
    label: "Blacks",
    hex: "#111111",
    shades: ["Jet Black", "Washed Black", "Obsidian"],
  },
  reds: {
    label: "Burgundy & Reds",
    hex: "#7A1F2B",
    shades: ["Burgundy", "Maroon", "Oxblood", "Rust", "Terracotta"],
  },
  pastels: {
    label: "Pastels & Other",
    hex: "#D7B9C3",
    shades: ["Dusty Pink", "Lavender", "Mustard", "Ochre"],
  },
};

export const GARMENT_SLOTS = ["top", "layer", "bottom", "shoes"] as const;
export type GarmentSlot = (typeof GARMENT_SLOTS)[number];

export const SLOT_META: Record<GarmentSlot, { label: string; short: string }> = {
  top: { label: "Top / Shirt", short: "Top" },
  layer: { label: "Jacket / Blazer / Coat", short: "Jacket" },
  bottom: { label: "Pants / Trousers", short: "Bottom" },
  shoes: { label: "Shoes", short: "Shoes" },
};

export function isColorFamily(v: unknown): v is ColorFamily {
  return typeof v === "string" && (COLOR_FAMILIES as readonly string[]).includes(v);
}

export function isGarmentSlot(v: unknown): v is GarmentSlot {
  return typeof v === "string" && (GARMENT_SLOTS as readonly string[]).includes(v);
}

/** Maps a specific shade name (e.g. "Camel") to its broad colour family, if known. */
export function familyForShadeName(name: string): ColorFamily | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  for (const fam of COLOR_FAMILIES) {
    if (FAMILY_META[fam].shades.some((s) => n.includes(s.toLowerCase()))) return fam;
  }
  if (n.includes("white") || n.includes("cream")) return "whites";
  if (n.includes("black")) return "blacks";
  if (n.includes("grey") || n.includes("gray")) return "greys";
  if (n.includes("brown")) return "browns";
  if (n.includes("blue")) return "blues";
  if (n.includes("green")) return "greens";
  if (n.includes("red")) return "reds";
  return null;
}

/** Heuristic suggestion of the broad family for an arbitrary hex colour. */
export function suggestFamilyFromHex(hex: string): ColorFamily {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m || !m[1]) return "greys";
  const num = parseInt(m[1], 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  if (l < 0.1) return "blacks";
  if (s < 0.1) {
    if (l > 0.9) return "whites";
    return "greys";
  }
  if (l > 0.88 && s < 0.5) return "whites";
  if (h < 15 || h >= 340) return l > 0.7 ? "pastels" : "reds";
  if (h < 50) return s < 0.55 || l < 0.5 ? (h < 25 && s > 0.6 ? "reds" : "browns") : "pastels";
  if (h < 70) return l > 0.55 && s > 0.6 ? "pastels" : "browns";
  if (h < 170) return "greens";
  if (h < 260) return "blues";
  return "pastels";
}

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
