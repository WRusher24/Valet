import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { COLOR_FAMILIES, GARMENT_SLOTS, SEASONS } from "@/lib/constants";
import { WARDROBE_CATEGORIES, WARDROBE_FAMILIES } from "@/lib/closet";

export const seasonEnum = pgEnum("season", SEASONS);
export const colorFamilyEnum = pgEnum("color_family", COLOR_FAMILIES);
export const garmentSlotEnum = pgEnum("garment_slot", GARMENT_SLOTS);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/** `userId` NULL ⇒ curated starter library; otherwise private to that user. */
export const combos = pgTable(
  "combos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    season: seasonEnum("season").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("combos_slug_idx").on(t.slug),
    index("combos_user_idx").on(t.userId),
    index("combos_season_idx").on(t.season),
  ],
);

export const comboColors = pgTable(
  "combo_colors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comboId: uuid("combo_id")
      .notNull()
      .references(() => combos.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    hex: text("hex").notNull(),
    family: colorFamilyEnum("family").notNull(),
  },
  (t) => [
    index("combo_colors_combo_idx").on(t.comboId),
    uniqueIndex("combo_colors_pos_idx").on(t.comboId, t.position),
  ],
);

export const outfits = pgTable(
  "outfits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comboId: uuid("combo_id")
      .notNull()
      .references(() => combos.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    style: text("style").notNull().default("Smart Casual"),
    season: seasonEnum("season").notNull(),
    imageUrl: text("image_url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("outfits_combo_idx").on(t.comboId), index("outfits_user_idx").on(t.userId)],
);

export const outfitItems = pgTable(
  "outfit_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfits.id, { onDelete: "cascade" }),
    slot: garmentSlotEnum("slot").notNull(),
    description: text("description").notNull(),
    family: colorFamilyEnum("family").notNull(),
  },
  (t) => [
    index("outfit_items_outfit_idx").on(t.outfitId),
    index("outfit_items_filter_idx").on(t.slot, t.family),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfits.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.outfitId] })],
);

export const wearLogs = pgTable(
  "wear_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfits.id, { onDelete: "cascade" }),
    comboId: uuid("combo_id")
      .notNull()
      .references(() => combos.id, { onDelete: "cascade" }),
    wornOn: date("worn_on", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("wear_logs_user_idx").on(t.userId, t.wornOn)],
);

export type Combo = typeof combos.$inferSelect;
export type ComboColor = typeof comboColors.$inferSelect;
export type Outfit = typeof outfits.$inferSelect;
export type OutfitItem = typeof outfitItems.$inferSelect;

/** Per-user "removed from my view" markers for curated (shared) outfits. */
export const hiddenOutfits = pgTable(
  "hidden_outfits",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    outfitId: uuid("outfit_id")
      .notNull()
      .references(() => outfits.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.outfitId] })],
);

/** Per-user "removed from my view" markers for curated (shared) combinations. */
export const hiddenCombos = pgTable(
  "hidden_combos",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    comboId: uuid("combo_id")
      .notNull()
      .references(() => combos.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.comboId] })],
);

/* ------------------------------------------------------------------ */
/* My Closet                                                           */
/* ------------------------------------------------------------------ */

export const wardrobeCategoryEnum = pgEnum("wardrobe_category", WARDROBE_CATEGORIES);
export const wardrobeFamilyEnum = pgEnum("wardrobe_color_family", WARDROBE_FAMILIES);

/** A physical garment or accessory owned by one user. Always filtered by `user_id`. */
export const wardrobeItems = pgTable(
  "wardrobe_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    category: wardrobeCategoryEnum("category").notNull(),
    subTypeName: text("sub_type_name").notNull(),
    colorFamily: wardrobeFamilyEnum("color_family").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("wardrobe_items_user_cat_idx").on(t.userId, t.category)],
);

/**
 * An outfit assembled from the user's own wardrobe items, optionally built against a
 * specific colour combination. Required slots cascade (deleting that item deletes the
 * outfit); optional slots are cleared instead, so the outfit survives without that piece.
 */
export const savedClosetOutfits = pgTable(
  "saved_closet_outfits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    colorComboId: uuid("color_combo_id").references(() => combos.id, { onDelete: "set null" }),
    name: text("name"),
    topId: uuid("top_id")
      .notNull()
      .references(() => wardrobeItems.id, { onDelete: "cascade" }),
    bottomId: uuid("bottom_id")
      .notNull()
      .references(() => wardrobeItems.id, { onDelete: "cascade" }),
    shoesId: uuid("shoes_id")
      .notNull()
      .references(() => wardrobeItems.id, { onDelete: "cascade" }),
    outerwearId: uuid("outerwear_id").references(() => wardrobeItems.id, { onDelete: "set null" }),
    beltId: uuid("belt_id").references(() => wardrobeItems.id, { onDelete: "set null" }),
    watchId: uuid("watch_id").references(() => wardrobeItems.id, { onDelete: "set null" }),
    braceletId: uuid("bracelet_id").references(() => wardrobeItems.id, { onDelete: "set null" }),
    season: seasonEnum("season").notNull().default("all_season"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("saved_closet_outfits_user_idx").on(t.userId, t.createdAt),
    index("saved_closet_outfits_combo_idx").on(t.colorComboId),
  ],
);

/** "Wore This Today" entries for saved closet outfits (private to the user). */
export const closetWearLogs = pgTable(
  "closet_wear_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    savedOutfitId: uuid("saved_outfit_id")
      .notNull()
      .references(() => savedClosetOutfits.id, { onDelete: "cascade" }),
    wornOn: date("worn_on", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("closet_wear_logs_user_idx").on(t.userId, t.wornOn)],
);

export type WardrobeItemRow = typeof wardrobeItems.$inferSelect;
