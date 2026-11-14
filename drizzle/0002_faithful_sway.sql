CREATE TYPE "public"."wardrobe_category" AS ENUM('top', 'bottom', 'outerwear', 'shoes', 'belt', 'watch', 'bracelet');--> statement-breakpoint
CREATE TYPE "public"."wardrobe_color_family" AS ENUM('browns', 'blues', 'greys', 'greens', 'whites_creams', 'blacks', 'burgundy_reds', 'pastels_other');--> statement-breakpoint
CREATE TABLE "closet_outfit_items" (
	"outfit_id" uuid NOT NULL,
	"category" "wardrobe_category" NOT NULL,
	"item_id" uuid NOT NULL,
	CONSTRAINT "closet_outfit_items_outfit_id_category_pk" PRIMARY KEY("outfit_id","category")
);
--> statement-breakpoint
CREATE TABLE "closet_outfits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"season" "season" DEFAULT 'all_season' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wardrobe_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"category" "wardrobe_category" NOT NULL,
	"sub_type_name" text NOT NULL,
	"color_family" "wardrobe_color_family" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "closet_outfit_items" ADD CONSTRAINT "closet_outfit_items_outfit_id_closet_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."closet_outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closet_outfit_items" ADD CONSTRAINT "closet_outfit_items_item_id_wardrobe_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closet_outfits" ADD CONSTRAINT "closet_outfits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wardrobe_items" ADD CONSTRAINT "wardrobe_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "closet_outfit_items_item_idx" ON "closet_outfit_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "closet_outfits_user_idx" ON "closet_outfits" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "wardrobe_items_user_cat_idx" ON "wardrobe_items" USING btree ("user_id","category");