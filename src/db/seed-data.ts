import type { ColorFamily, GarmentSlot, Season } from "@/lib/constants";

export interface SeedColor {
  name: string;
  hex: string;
  family: ColorFamily;
}

export interface SeedOutfit {
  title: string;
  style: string;
  season: Exclude<Season, "all_season">;
  imageUrl: string;
  items: { slot: GarmentSlot; description: string; family: ColorFamily }[];
}

export interface SeedCombo {
  slug: string;
  title: string;
  description: string;
  season: Season;
  colors: SeedColor[];
  outfits: SeedOutfit[];
}

/** Curated Unsplash men's fashion / street-style / office-wear photo ids. */
const PHOTO_POOL = [
  "1507679799987-c73779587ccf", "1617137968427-85924c800a22", "1593030761757-71fae45fa0e7",
  "1490578474895-699cd4e2cf59", "1488161628813-04466f872be2", "1516826957135-700dedea698c",
  "1552374196-1ab2a1c593e8", "1519085360753-af0119f7cbe7", "1500648767791-00dcc994a43e",
  "1492562080023-ab3db95bfbce", "1480455624313-e29b44bbfde1", "1506794778202-cad84cf45f1d",
  "1472099645785-5658abf4ff4e", "1463453091185-61582044d556", "1530268729831-4b0b9e170218",
  "1504257432389-52343af06ae3", "1521341957697-b93449760f30", "1550928431-ee0ec6db30d3",
  "1556905055-8f358a7a47b2", "1534030347209-467a5b0ad3e6", "1496345875659-11f7dd282d1d",
  "1503341504253-dff4815485f1", "1521572267360-ee0c2909d518", "1516257984-b1b4d707412e",
  "1529068755536-a5ade0dcb4e8", "1507003211169-0a1dd7228f2d", "1560250097-0b93528c311a",
  "1566492031773-4f4e44671857", "1581803118522-7b72a50f7e9f", "1519058082700-08a0b56da9b4",
  "1548624313-0396c75e4b1a", "1504593811423-6dd665756598", "1583743814966-8936f5b7be1a",
  "1602810318383-e386cc2a3ccf", "1617196034796-73dfa7b1fd56", "1594938298603-c8148c4dae35",
  "1611312449408-fcece27cdbb7", "1591047139829-d91aecb6caea", "1620012253295-c15cc3e65df4",
  "1621072156002-e2fccdc0b176", "1507680434567-5739c80be1ac", "1495385794356-15371f348c31",
  "1520975954732-35dd22299614", "1558769132-cb1aea458c5e", "1514996937319-344454492b37",
  "1487222477894-8943e31ef7b2", "1490114538077-0a7f8cb49891", "1507114845806-0347f6150324",
  "1492288991661-058aa541ff43", "1512310604669-443f26c35f52", "1522529599102-193c0d76b5b6",
  "1531427186611-ecfd6d936c79", "1480429370139-e0132c086e2a", "1485462537746-965f33f7f6a7",
  "1503443207922-dff7d543fd0e", "1519238263530-99bdd11df2ea",
] as const;

let cursor = 0;
function nextPhoto(): string {
  const id = PHOTO_POOL[cursor % PHOTO_POOL.length];
  cursor += 1;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;
}

type Piece = [description: string, family: ColorFamily];

function outfit(
  title: string,
  style: string,
  season: "summer" | "winter",
  top: Piece,
  layer: Piece | null,
  bottom: Piece,
  shoes: Piece,
): SeedOutfit {
  const items: SeedOutfit["items"] = [];
  if (layer) items.push({ slot: "layer", description: layer[0], family: layer[1] });
  items.push({ slot: "top", description: top[0], family: top[1] });
  items.push({ slot: "bottom", description: bottom[0], family: bottom[1] });
  items.push({ slot: "shoes", description: shoes[0], family: shoes[1] });
  return { title, style, season, imageUrl: nextPhoto(), items };
}

const c = (name: string, hex: string, family: ColorFamily): SeedColor => ({ name, hex, family });

export const SEED_COMBOS: SeedCombo[] = [
  {
    slug: "navy-camel-white",
    title: "Navy + Camel + Crisp White",
    description: "The foundation of menswear: cool navy, warm camel, clean white.",
    season: "all_season",
    colors: [c("Navy", "#1B263B", "blues"), c("Camel", "#C19A6B", "browns"), c("Crisp White", "#FFFFFF", "whites")],
    outfits: [
      outfit("The Boardroom Classic", "Office", "winter", ["White Oxford Shirt", "whites"], ["Navy Unstructured Blazer", "blues"], ["Camel Wool Trousers", "browns"], ["Dark Brown Suede Loafers", "browns"]),
      outfit("Weekend Client Lunch", "Smart Casual", "summer", ["White Linen Shirt", "whites"], ["Navy Cotton Blazer", "blues"], ["Camel Chinos", "browns"], ["Tan Leather Loafers", "browns"]),
      outfit("Camel Overcoat Commute", "Tailored", "winter", ["White Poplin Shirt", "whites"], ["Camel Wool Overcoat", "browns"], ["Navy Flannel Trousers", "blues"], ["Cognac Derby Shoes", "browns"]),
      outfit("Studio Day", "Creative Business-Casual", "summer", ["Navy Knit Polo", "blues"], null, ["Off-White Cotton Trousers", "whites"], ["Camel Suede Sneakers", "browns"]),
    ],
  },
  {
    slug: "charcoal-black-white",
    title: "Charcoal + Black + White",
    description: "Monochrome authority with a crisp white break.",
    season: "winter",
    colors: [c("Charcoal", "#36454F", "greys"), c("Jet Black", "#0B0B0D", "blacks"), c("Crisp White", "#FFFFFF", "whites")],
    outfits: [
      outfit("Night-Shift Tailoring", "Tailored", "winter", ["White Spread-Collar Shirt", "whites"], ["Charcoal Wool Suit Jacket", "greys"], ["Charcoal Suit Trousers", "greys"], ["Black Cap-Toe Oxfords", "blacks"]),
      outfit("Black Knit Meeting", "Knitwear", "winter", ["Black Merino Roll Neck", "blacks"], ["Charcoal Overcoat", "greys"], ["Black Wool Trousers", "blacks"], ["Black Leather Chelsea Boots", "blacks"]),
      outfit("Quiet Minimal", "Creative Business-Casual", "winter", ["White Crew-Neck Tee", "whites"], ["Black Wool Blazer", "blacks"], ["Charcoal Tapered Trousers", "greys"], ["White Minimal Leather Sneakers", "whites"]),
      outfit("Modern Monday", "Office", "winter", ["White Oxford Shirt", "whites"], ["Black Cardigan", "blacks"], ["Charcoal Flannel Trousers", "greys"], ["Black Penny Loafers", "blacks"]),
    ],
  },
  {
    slug: "olive-beige-brown-white",
    title: "Olive + Beige + Dark Brown + White",
    description: "Earthy four-tone palette that looks effortless year-round.",
    season: "all_season",
    colors: [c("Olive", "#5B6236", "greens"), c("Beige", "#D8C7A8", "browns"), c("Dark Brown", "#3E2A1E", "browns"), c("Off-White", "#F4F1EA", "whites")],
    outfits: [
      outfit("Field-Jacket Smart", "Smart Casual", "winter", ["Off-White Oxford Shirt", "whites"], ["Olive Field Jacket", "greens"], ["Beige Chinos", "browns"], ["Dark Brown Leather Boots", "browns"]),
      outfit("Safari Office", "Creative Business-Casual", "summer", ["Olive Camp-Collar Shirt", "greens"], null, ["Beige Linen Trousers", "browns"], ["Dark Brown Suede Loafers", "browns"]),
      outfit("Autumn Walk", "Knitwear", "winter", ["Off-White Fisherman Sweater", "whites"], ["Olive Waxed Jacket", "greens"], ["Dark Brown Corduroy Trousers", "browns"], ["Brown Leather Derbies", "browns"]),
      outfit("Terrace Lunch", "Smart Casual", "summer", ["Off-White Linen Tee", "whites"], ["Beige Unstructured Blazer", "browns"], ["Olive Cotton Trousers", "greens"], ["Dark Brown Penny Loafers", "browns"]),
    ],
  },
  {
    slug: "light-blue-grey-brown",
    title: "Light Blue + Grey + Brown",
    description: "Fresh, approachable business-casual with a warm leather anchor.",
    season: "summer",
    colors: [c("Sky Blue", "#A9C6E8", "blues"), c("Light Grey", "#B8BBBF", "greys"), c("Tan", "#A47551", "browns")],
    outfits: [
      outfit("Summer Suiting", "Office", "summer", ["Sky Blue Oxford Shirt", "blues"], ["Light Grey Lightweight Blazer", "greys"], ["Light Grey Trousers", "greys"], ["Tan Leather Loafers", "browns"]),
      outfit("Rolled-Sleeve Friday", "Smart Casual", "summer", ["Chambray Shirt", "blues"], null, ["Light Grey Chinos", "greys"], ["Tan Suede Derbies", "browns"]),
      outfit("City Stroll", "Smart Casual", "summer", ["Sky Blue Polo", "blues"], ["Grey Cotton Bomber", "greys"], ["Tan Chinos", "browns"], ["Brown Leather Sneakers", "browns"]),
      outfit("Airy Tailoring", "Tailored", "summer", ["Light Blue Linen Shirt", "blues"], ["Heather Grey Linen Blazer", "greys"], ["Stone Trousers", "greys"], ["Cognac Monk Straps", "browns"]),
    ],
  },
  {
    slug: "burgundy-navy-grey",
    title: "Burgundy + Navy + Grey",
    description: "Rich autumn depth: a wine accent against navy and soft grey.",
    season: "winter",
    colors: [c("Burgundy", "#6D1F2F", "reds"), c("Navy", "#1B263B", "blues"), c("Heather", "#9A9CA0", "greys")],
    outfits: [
      outfit("Wine & Wool", "Knitwear", "winter", ["Burgundy Merino Sweater", "reds"], ["Navy Wool Blazer", "blues"], ["Heather Grey Flannel Trousers", "greys"], ["Dark Brown Leather Loafers", "browns"]),
      outfit("Oxblood Accents", "Smart Casual", "winter", ["Heather Grey Crewneck", "greys"], ["Navy Peacoat", "blues"], ["Burgundy Corduroy Trousers", "reds"], ["Black Leather Boots", "blacks"]),
      outfit("Dinner Meeting", "Tailored", "winter", ["Burgundy Knit Tie & White Shirt", "reds"], ["Navy Three-Piece Jacket", "blues"], ["Grey Wool Trousers", "greys"], ["Burgundy Penny Loafers", "reds"]),
    ],
  },
  {
    slug: "sand-espresso-cream",
    title: "Sand + Espresso + Cream",
    description: "Soft, tonal neutrals grounded by deep espresso leather.",
    season: "summer",
    colors: [c("Sand", "#D9C7A3", "whites"), c("Espresso", "#3B2A22", "browns"), c("Ivory", "#F5F0E1", "whites")],
    outfits: [
      outfit("Tonal Linen", "Smart Casual", "summer", ["Ivory Linen Shirt", "whites"], ["Sand Linen Blazer", "whites"], ["Sand Chinos", "whites"], ["Espresso Suede Loafers", "browns"]),
      outfit("Cream Polo Office", "Office", "summer", ["Ivory Knit Polo", "whites"], null, ["Espresso Wool Trousers", "browns"], ["Espresso Leather Derbies", "browns"]),
      outfit("Coastal Business", "Creative Business-Casual", "summer", ["Sand Short-Sleeve Camp Shirt", "whites"], null, ["Ivory Cotton Trousers", "whites"], ["Espresso Woven Loafers", "browns"]),
      outfit("Gallery Opening", "Tailored", "summer", ["Cream Silk-Blend Tee", "whites"], ["Espresso Unlined Blazer", "browns"], ["Sand Pleated Trousers", "whites"], ["Cream Leather Sneakers", "whites"]),
    ],
  },
  {
    slug: "forest-charcoal-black",
    title: "Forest Green + Charcoal + Black",
    description: "Moody, authoritative winter palette with a woodland edge.",
    season: "winter",
    colors: [c("Forest Green", "#1F3D2B", "greens"), c("Charcoal", "#36454F", "greys"), c("Jet Black", "#0B0B0D", "blacks")],
    outfits: [
      outfit("Forest Knit Brief", "Knitwear", "winter", ["Forest Green Merino Sweater", "greens"], ["Charcoal Overcoat", "greys"], ["Black Wool Trousers", "blacks"], ["Black Leather Chelsea Boots", "blacks"]),
      outfit("Hunter Tailoring", "Tailored", "winter", ["Black Fine-Knit Polo", "blacks"], ["Forest Green Wool Blazer", "greens"], ["Charcoal Trousers", "greys"], ["Black Derby Shoes", "blacks"]),
      outfit("Evening Creative", "Creative Business-Casual", "winter", ["Charcoal Henley", "greys"], ["Dark Green Chore Coat", "greens"], ["Black Slim Jeans", "blacks"], ["Black Suede Boots", "blacks"]),
    ],
  },
  {
    slug: "navy-white",
    title: "Navy + Crisp White",
    description: "Two colours, zero effort — the sharpest simple pairing.",
    season: "summer",
    colors: [c("Navy", "#1B263B", "blues"), c("Crisp White", "#FFFFFF", "whites")],
    outfits: [
      outfit("Navy Suit, White Shirt", "Tailored", "summer", ["White Poplin Shirt", "whites"], ["Navy Lightweight Suit Jacket", "blues"], ["Navy Suit Trousers", "blues"], ["White Leather Sneakers", "whites"]),
      outfit("Breton Smart", "Smart Casual", "summer", ["White Cotton Tee", "whites"], ["Navy Cotton Overshirt", "blues"], ["White Cotton Trousers", "whites"], ["Navy Canvas Sneakers", "blues"]),
      outfit("Polo & Pleats", "Office", "summer", ["Navy Piqué Polo", "blues"], null, ["White Pleated Trousers", "whites"], ["White Minimal Sneakers", "whites"]),
    ],
  },
  {
    slug: "stone-navy",
    title: "Stone Grey + Navy",
    description: "A calm cool-toned pairing that suits any office dress code.",
    season: "all_season",
    colors: [c("Stone", "#B7B2A7", "greys"), c("Navy", "#1B263B", "blues")],
    outfits: [
      outfit("Stone Suit Sunday", "Tailored", "summer", ["Navy Knit Polo", "blues"], ["Stone Cotton Blazer", "greys"], ["Stone Trousers", "greys"], ["Navy Suede Loafers", "blues"]),
      outfit("Navy Knit Day", "Knitwear", "winter", ["Navy Merino Crewneck", "blues"], null, ["Stone Wool Trousers", "greys"], ["Grey Suede Derbies", "greys"]),
      outfit("Commuter Cool", "Smart Casual", "winter", ["Stone Oxford Shirt", "greys"], ["Navy Wool Overcoat", "blues"], ["Navy Chinos", "blues"], ["Stone Leather Sneakers", "greys"]),
    ],
  },
  {
    slug: "chocolate-ivory",
    title: "Chocolate + Ivory",
    description: "Warm, luxurious contrast built on chocolate brown.",
    season: "winter",
    colors: [c("Chocolate", "#4A2C1D", "browns"), c("Ivory", "#F5F0E1", "whites")],
    outfits: [
      outfit("Chocolate Corduroy", "Smart Casual", "winter", ["Ivory Cable-Knit Sweater", "whites"], null, ["Chocolate Corduroy Trousers", "browns"], ["Chocolate Suede Boots", "browns"]),
      outfit("Brown Suit, Ivory Shirt", "Tailored", "winter", ["Ivory Oxford Shirt", "whites"], ["Chocolate Wool Blazer", "browns"], ["Chocolate Wool Trousers", "browns"], ["Dark Brown Brogues", "browns"]),
      outfit("Shearling Season", "Creative Business-Casual", "winter", ["Ivory Turtleneck", "whites"], ["Chocolate Suede Jacket", "browns"], ["Ivory Wool Trousers", "whites"], ["Brown Leather Chelsea Boots", "browns"]),
    ],
  },
  {
    slug: "skyblue-sand-white-tan",
    title: "Sky Blue + Sand + White + Tan",
    description: "A breezy four-colour summer palette inspired by coastal tailoring.",
    season: "summer",
    colors: [c("Sky Blue", "#A9C6E8", "blues"), c("Sand", "#D9C7A3", "whites"), c("Crisp White", "#FFFFFF", "whites"), c("Tan", "#A47551", "browns")],
    outfits: [
      outfit("Linen Summit", "Smart Casual", "summer", ["Sky Blue Linen Shirt", "blues"], ["Sand Linen Blazer", "whites"], ["White Cotton Trousers", "whites"], ["Tan Leather Loafers", "browns"]),
      outfit("Open-Collar Office", "Office", "summer", ["Light Blue Cotton Shirt", "blues"], null, ["Sand Chinos", "whites"], ["Tan Suede Loafers", "browns"]),
      outfit("Riviera Meeting", "Tailored", "summer", ["White Polo Shirt", "whites"], ["Sky Blue Seersucker Jacket", "blues"], ["Sand Pleated Trousers", "whites"], ["Tan Woven Loafers", "browns"]),
    ],
  },
  {
    slug: "rust-navy-cream",
    title: "Rust + Navy + Cream",
    description: "Autumn warmth with a navy backbone.",
    season: "winter",
    colors: [c("Rust", "#9C4A2B", "reds"), c("Navy", "#1B263B", "blues"), c("Ecru", "#EFE8D6", "whites")],
    outfits: [
      outfit("Rust Knit Review", "Knitwear", "winter", ["Rust Wool Sweater", "reds"], ["Navy Wool Coat", "blues"], ["Ecru Cotton Trousers", "whites"], ["Dark Brown Suede Boots", "browns"]),
      outfit("Terracotta Tailoring", "Tailored", "winter", ["Ecru Oxford Shirt", "whites"], ["Rust Tweed Blazer", "reds"], ["Navy Flannel Trousers", "blues"], ["Brown Leather Brogues", "browns"]),
      outfit("Harvest Casual", "Smart Casual", "winter", ["Navy Henley", "blues"], ["Rust Corduroy Overshirt", "reds"], ["Ecru Chinos", "whites"], ["Tan Leather Boots", "browns"]),
    ],
  },
  {
    slug: "sage-offwhite-cognac",
    title: "Sage + Off-White + Cognac",
    description: "Soft green and warm leather for a relaxed summer office.",
    season: "summer",
    colors: [c("Sage", "#9CAF88", "greens"), c("Off-White", "#F4F1EA", "whites"), c("Cognac", "#9A4E1C", "browns")],
    outfits: [
      outfit("Sage Linen Suit", "Tailored", "summer", ["Off-White Linen Tee", "whites"], ["Sage Linen Blazer", "greens"], ["Sage Linen Trousers", "greens"], ["Cognac Leather Loafers", "browns"]),
      outfit("Garden Meeting", "Smart Casual", "summer", ["Sage Short-Sleeve Shirt", "greens"], null, ["Off-White Chinos", "whites"], ["Cognac Suede Loafers", "browns"]),
      outfit("Studio Linen", "Creative Business-Casual", "summer", ["Off-White Oxford Shirt", "whites"], ["Sage Chore Jacket", "greens"], ["Stone Trousers", "greys"], ["Cognac Derby Shoes", "browns"]),
    ],
  },
  {
    slug: "black-camel",
    title: "Black + Camel",
    description: "Dramatic, high-contrast winter pairing with an editorial feel.",
    season: "winter",
    colors: [c("Jet Black", "#0B0B0D", "blacks"), c("Camel", "#C19A6B", "browns")],
    outfits: [
      outfit("Camel Coat, Black Knit", "Tailored", "winter", ["Black Merino Turtleneck", "blacks"], ["Camel Wool Overcoat", "browns"], ["Black Wool Trousers", "blacks"], ["Black Leather Chelsea Boots", "blacks"]),
      outfit("Black Suit, Camel Knit", "Office", "winter", ["Camel Fine-Knit Sweater", "browns"], ["Black Wool Blazer", "blacks"], ["Black Suit Trousers", "blacks"], ["Black Leather Loafers", "blacks"]),
      outfit("After-Hours Edit", "Smart Casual", "winter", ["Black Cotton Tee", "blacks"], ["Camel Suede Jacket", "browns"], ["Black Slim Trousers", "blacks"], ["Camel Suede Boots", "browns"]),
    ],
  },
  {
    slug: "slate-grey-brown-ivory",
    title: "Slate Blue + Light Grey + Dark Brown + Ivory",
    description: "A refined four-colour palette that bridges seasons.",
    season: "all_season",
    colors: [c("Slate Blue", "#5C6F8C", "blues"), c("Light Grey", "#B8BBBF", "greys"), c("Dark Brown", "#3E2A1E", "browns"), c("Ivory", "#F5F0E1", "whites")],
    outfits: [
      outfit("Slate Separates", "Smart Casual", "winter", ["Ivory Oxford Shirt", "whites"], ["Slate Blue Wool Blazer", "blues"], ["Light Grey Flannel Trousers", "greys"], ["Dark Brown Suede Loafers", "browns"]),
      outfit("Soft Knit Friday", "Knitwear", "winter", ["Slate Blue Merino Sweater", "blues"], null, ["Light Grey Wool Trousers", "greys"], ["Dark Brown Leather Boots", "browns"]),
      outfit("Mid-Season Meeting", "Office", "summer", ["Ivory Linen-Cotton Shirt", "whites"], ["Light Grey Cotton Blazer", "greys"], ["Slate Blue Chinos", "blues"], ["Dark Brown Leather Derbies", "browns"]),
    ],
  },
  {
    slug: "dustypink-navy-white",
    title: "Dusty Pink + Navy + Crisp White",
    description: "A confident summer accent: muted pink against navy and white.",
    season: "summer",
    colors: [c("Dusty Pink", "#D9A5A8", "pastels"), c("Navy", "#1B263B", "blues"), c("Crisp White", "#FFFFFF", "whites")],
    outfits: [
      outfit("Pink Oxford, Navy Suit", "Tailored", "summer", ["Dusty Pink Oxford Shirt", "pastels"], ["Navy Lightweight Blazer", "blues"], ["Navy Trousers", "blues"], ["White Leather Sneakers", "whites"]),
      outfit("Pastel Polo Day", "Smart Casual", "summer", ["Dusty Pink Piqué Polo", "pastels"], null, ["White Chinos", "whites"], ["Navy Suede Loafers", "blues"]),
      outfit("Sunday Brunch", "Creative Business-Casual", "summer", ["White Linen Shirt", "whites"], ["Dusty Pink Cotton Overshirt", "pastels"], ["Navy Tailored Shorts", "blues"], ["White Canvas Sneakers", "whites"]),
    ],
  },
];
