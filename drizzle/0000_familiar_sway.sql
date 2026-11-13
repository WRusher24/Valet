CREATE TYPE "public"."color_family" AS ENUM('browns', 'blues', 'greys', 'greens', 'whites', 'blacks', 'reds', 'pastels');--> statement-breakpoint
CREATE TYPE "public"."garment_slot" AS ENUM('top', 'layer', 'bottom', 'shoes');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('summer', 'winter', 'all_season');--> statement-breakpoint
CREATE TABLE "combo_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"combo_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"hex" text NOT NULL,
	"family" "color_family" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"user_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"season" "season" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" uuid NOT NULL,
	"outfit_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_outfit_id_pk" PRIMARY KEY("user_id","outfit_id")
);
--> statement-breakpoint
CREATE TABLE "outfit_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outfit_id" uuid NOT NULL,
	"slot" "garment_slot" NOT NULL,
	"description" text NOT NULL,
	"family" "color_family" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"combo_id" uuid NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"style" text DEFAULT 'Smart Casual' NOT NULL,
	"season" "season" NOT NULL,
	"image_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wear_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"outfit_id" uuid NOT NULL,
	"combo_id" uuid NOT NULL,
	"worn_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "combo_colors" ADD CONSTRAINT "combo_colors_combo_id_combos_id_fk" FOREIGN KEY ("combo_id") REFERENCES "public"."combos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combos" ADD CONSTRAINT "combos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_combo_id_combos_id_fk" FOREIGN KEY ("combo_id") REFERENCES "public"."combos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_logs" ADD CONSTRAINT "wear_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_logs" ADD CONSTRAINT "wear_logs_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_logs" ADD CONSTRAINT "wear_logs_combo_id_combos_id_fk" FOREIGN KEY ("combo_id") REFERENCES "public"."combos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "combo_colors_combo_idx" ON "combo_colors" USING btree ("combo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "combo_colors_pos_idx" ON "combo_colors" USING btree ("combo_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "combos_slug_idx" ON "combos" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "combos_user_idx" ON "combos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "combos_season_idx" ON "combos" USING btree ("season");--> statement-breakpoint
CREATE INDEX "outfit_items_outfit_idx" ON "outfit_items" USING btree ("outfit_id");--> statement-breakpoint
CREATE INDEX "outfit_items_filter_idx" ON "outfit_items" USING btree ("slot","family");--> statement-breakpoint
CREATE INDEX "outfits_combo_idx" ON "outfits" USING btree ("combo_id");--> statement-breakpoint
CREATE INDEX "outfits_user_idx" ON "outfits" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "wear_logs_user_idx" ON "wear_logs" USING btree ("user_id","worn_on");