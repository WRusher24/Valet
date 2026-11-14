CREATE TABLE "closet_wear_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"saved_outfit_id" uuid NOT NULL,
	"worn_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_closet_outfits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"color_combo_id" uuid,
	"name" text,
	"top_id" uuid NOT NULL,
	"bottom_id" uuid NOT NULL,
	"shoes_id" uuid NOT NULL,
	"outerwear_id" uuid,
	"belt_id" uuid,
	"watch_id" uuid,
	"bracelet_id" uuid,
	"season" "season" DEFAULT 'all_season' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "closet_wear_logs" ADD CONSTRAINT "closet_wear_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closet_wear_logs" ADD CONSTRAINT "closet_wear_logs_saved_outfit_id_saved_closet_outfits_id_fk" FOREIGN KEY ("saved_outfit_id") REFERENCES "public"."saved_closet_outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_closet_outfits" ADD CONSTRAINT "saved_closet_outfits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_closet_outfits" ADD CONSTRAINT "saved_closet_outfits_color_combo_id_combos_id_fk" FOREIGN KEY ("color_combo_id") REFERENCES "public"."combos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_closet_outfits" ADD CONSTRAINT "saved_closet_outfits_top_id_wardrobe_items_id_fk" FOREIGN KEY ("top_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_closet_outfits" ADD CONSTRAINT "saved_closet_outfits_bottom_id_wardrobe_items_id_fk" FOREIGN KEY ("bottom_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_closet_outfits" ADD CONSTRAINT "saved_closet_outfits_shoes_id_wardrobe_items_id_fk" FOREIGN KEY ("shoes_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_closet_outfits" ADD CONSTRAINT "saved_closet_outfits_outerwear_id_wardrobe_items_id_fk" FOREIGN KEY ("outerwear_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_closet_outfits" ADD CONSTRAINT "saved_closet_outfits_belt_id_wardrobe_items_id_fk" FOREIGN KEY ("belt_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_closet_outfits" ADD CONSTRAINT "saved_closet_outfits_watch_id_wardrobe_items_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_closet_outfits" ADD CONSTRAINT "saved_closet_outfits_bracelet_id_wardrobe_items_id_fk" FOREIGN KEY ("bracelet_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "closet_wear_logs_user_idx" ON "closet_wear_logs" USING btree ("user_id","worn_on");--> statement-breakpoint
CREATE INDEX "saved_closet_outfits_user_idx" ON "saved_closet_outfits" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "saved_closet_outfits_combo_idx" ON "saved_closet_outfits" USING btree ("color_combo_id");--> statement-breakpoint
-- Carry existing closet outfits over to the new table before 0005 drops the old ones.
INSERT INTO "saved_closet_outfits" ("id", "user_id", "name", "season", "top_id", "bottom_id", "shoes_id", "outerwear_id", "belt_id", "watch_id", "bracelet_id", "created_at")
SELECT
  co."id",
  co."user_id",
  co."name",
  co."season",
  (SELECT i."item_id" FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'top'),
  (SELECT i."item_id" FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'bottom'),
  (SELECT i."item_id" FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'shoes'),
  (SELECT i."item_id" FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'outerwear'),
  (SELECT i."item_id" FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'belt'),
  (SELECT i."item_id" FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'watch'),
  (SELECT i."item_id" FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'bracelet'),
  co."created_at"
FROM "closet_outfits" co
WHERE EXISTS (SELECT 1 FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'top')
  AND EXISTS (SELECT 1 FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'bottom')
  AND EXISTS (SELECT 1 FROM "closet_outfit_items" i WHERE i."outfit_id" = co."id" AND i."category" = 'shoes');
