import { z } from "zod";
import { SEASONS } from "./constants";
import { WARDROBE_CATEGORIES, WARDROBE_FAMILIES } from "./closet";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const uuidSchema = z.string().regex(UUID, "Invalid identifier.");

export const itemMetaSchema = z.object({
  category: z.enum(WARDROBE_CATEGORIES, { error: "Choose a category." }),
  subTypeName: z.string().trim().min(1, "Give the item a name.").max(80, "That name is too long."),
  colorFamily: z.enum(WARDROBE_FAMILIES, { error: "Choose a colour family." }),
});
export type ItemMeta = z.infer<typeof itemMetaSchema>;

export const closetOutfitSchema = z.object({
  name: z.string().trim().max(80, "That name is too long.").optional(),
  season: z.enum(SEASONS),
  items: z.object({
    top: uuidSchema,
    bottom: uuidSchema,
    shoes: uuidSchema,
    belt: uuidSchema,
    watch: uuidSchema,
    bracelet: uuidSchema,
    outerwear: uuidSchema.optional(),
  }),
});
export type ClosetOutfitInput = z.infer<typeof closetOutfitSchema>;

export const MAX_CLOSET_ITEMS = 300;
