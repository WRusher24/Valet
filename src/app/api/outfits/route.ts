import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { del, put } from "@vercel/blob";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { combos, outfitItems, outfits } from "@/db/schema";
import { COLOR_FAMILIES, FAMILY_META, GARMENT_SLOTS, OUTFIT_SEASONS, SLOT_META } from "@/lib/constants";
import { UUID_RE } from "@/lib/queries";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024; // Vercel serverless request bodies are capped at 4.5 MB.

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

function detectImage(b: Uint8Array): { ext: string; type: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { ext: "webp", type: "image/webp" };
  }
  return null;
}

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return fail("Your session has expired. Please sign in again.", 401);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return fail("Photo uploads aren't configured yet. Add BLOB_READ_WRITE_TOKEN to the environment.", 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("The upload could not be read. Please try again.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Choose a photo to upload.", 400);
  if (file.size > MAX_BYTES) return fail("That photo is too large. Please use an image under 4 MB.", 413);

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

  const buffer = new Uint8Array(await file.arrayBuffer());
  const image = detectImage(buffer);
  if (!image) return fail("Only JPEG, PNG or WebP photos are supported.", 415);

  let blobUrl: string;
  try {
    const blob = await put(`outfits/${userId}/${randomUUID()}.${image.ext}`, Buffer.from(buffer), {
      access: "public",
      contentType: image.type,
      addRandomSuffix: true,
    });
    blobUrl = blob.url;
  } catch {
    return fail("The photo could not be stored. Please try again.", 502);
  }

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
    await del(blobUrl).catch(() => undefined);
    return fail("The outfit could not be saved. Please try again.", 500);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, outfitId, comboId });
}
