ALTER TABLE "wardrobe_items" ALTER COLUMN "color_family" SET DATA TYPE text;--> statement-breakpoint
-- Preserve existing closet data: the old "browns" family becomes "browns_tan"; the retired
-- "pastels_other" family becomes "yellows_brights" (the closest remaining accent family).
UPDATE "wardrobe_items" SET "color_family" = 'browns_tan' WHERE "color_family" = 'browns';--> statement-breakpoint
UPDATE "wardrobe_items" SET "color_family" = 'yellows_brights' WHERE "color_family" = 'pastels_other';--> statement-breakpoint
DROP TYPE "public"."wardrobe_color_family";--> statement-breakpoint
CREATE TYPE "public"."wardrobe_color_family" AS ENUM('browns_tan', 'beige_khaki', 'stone_sand', 'blues', 'greys', 'greens', 'whites_creams', 'blacks', 'burgundy_reds', 'yellows_brights');--> statement-breakpoint
ALTER TABLE "wardrobe_items" ALTER COLUMN "color_family" SET DATA TYPE "public"."wardrobe_color_family" USING "color_family"::"public"."wardrobe_color_family";
