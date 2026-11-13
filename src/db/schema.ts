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
