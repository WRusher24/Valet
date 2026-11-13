import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { del } from "@vercel/blob";
import { blobDeleteTarget } from "@/lib/blob";
import { storeImage } from "@/lib/upload";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { combos, outfitItems, outfits } from "@/db/schema";
import { COLOR_FAMILIES, FAMILY_META, GARMENT_SLOTS, OUTFIT_SEASONS, SLOT_META } from "@/lib/constants";
import { UUID_RE } from "@/lib/queries";

export const runtime = "nodejs";
export const maxDuration = 30;

const metaSchema = z.object({
  comboId: z.string().regex(UUID_RE, "Choose a colour combination."),
  title: z.string().trim().min(1, "Give the outfit a short title.").max(80),
  season: z.enum(OUTFIT_SEASONS),
  items: z
    .array(
      z.object({
        slot: z.enum(GARMENT_SLOTS),
        family: z.enum(COLOR_FAMILIES),
        description: z.string().trim().max(80),
      }),
    )
    .min(1, "Tag at least one garment.")
    .max(4),
});

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return fail("Your session has expired. Please sign in again.", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("The upload could not be read. Please try again.", 400);
  }

  let metaRaw: unknown;
  try {
    metaRaw = JSON.parse(String(form.get("meta") ?? ""));
  } catch {
    return fail("Outfit details are missing.", 400);
  }
  const meta = metaSchema.safeParse(metaRaw);
  if (!meta.success) return fail(meta.error.issues[0]?.message ?? "Invalid outfit details.", 400);
  const { comboId, title, season, items } = meta.data;

  // The target combo must be curated or owned by this user.
  const [combo] = await db
    .select({ id: combos.id })
    .from(combos)
    .where(and(eq(combos.id, comboId), or(isNull(combos.userId), eq(combos.userId, userId))))
    .limit(1);
  if (!combo) return fail("That colour combination could not be found.", 404);

  const stored = await storeImage(userId, form.get("file"));
  if (!stored.ok) return fail(stored.error, stored.status);
  const blobUrl = stored.url;

  const outfitId = randomUUID();
  try {
    await db.batch([
      db.insert(outfits).values({
        id: outfitId,
        comboId,
        userId,
        title,
        style: "My Upload",
        season,
        imageUrl: blobUrl,
        sortOrder: 1000,
      }),
      db.insert(outfitItems).values(
        items.map((i) => ({
          outfitId,
          slot: i.slot,
          family: i.family,
          description: i.description || `${FAMILY_META[i.family].label} ${SLOT_META[i.slot].short}`,
        })),
      ),
    ]);
  } catch {
    const created = blobDeleteTarget(blobUrl);
    if (created) await del(created).catch(() => undefined);
    return fail("The outfit could not be saved. Please try again.", 500);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, outfitId, comboId });
}
