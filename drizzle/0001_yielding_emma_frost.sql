CREATE TABLE "hidden_combos" (
	"user_id" uuid NOT NULL,
	"combo_id" uuid NOT NULL,
	CONSTRAINT "hidden_combos_user_id_combo_id_pk" PRIMARY KEY("user_id","combo_id")
);
--> statement-breakpoint
CREATE TABLE "hidden_outfits" (
	"user_id" uuid NOT NULL,
	"outfit_id" uuid NOT NULL,
	CONSTRAINT "hidden_outfits_user_id_outfit_id_pk" PRIMARY KEY("user_id","outfit_id")
);
--> statement-breakpoint
ALTER TABLE "hidden_combos" ADD CONSTRAINT "hidden_combos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_combos" ADD CONSTRAINT "hidden_combos_combo_id_combos_id_fk" FOREIGN KEY ("combo_id") REFERENCES "public"."combos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_outfits" ADD CONSTRAINT "hidden_outfits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_outfits" ADD CONSTRAINT "hidden_outfits_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;