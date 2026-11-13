import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/db";
import { hiddenOutfits, outfitItems, outfits } from "@/db/schema";
import { isBlobUrl } from "@/lib/blob";
import { UUID_RE } from "@/lib/queries";
import { storeImage } from "@/lib/upload";

export const runtime = "nodejs";
export const maxDuration = 30;

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

/**
 * Replaces an outfit's photo with the user's upload.
 * - Own outfit: the photo is swapped in place.
 * - Starter outfit: the user gets a private copy (same garments) with their photo,
 *   and the starter original is hidden from their view only.
 */
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

  const outfitId = String(form.get("outfitId") ?? "");
  if (!UUID_RE.test(outfitId)) return fail("That outfit could not be found.", 404);

  const [outfit] = await db
    .select()
    .from(outfits)
    .where(and(eq(outfits.id, outfitId), or(isNull(outfits.userId), eq(outfits.userId, userId))))
    .limit(1);
  if (!outfit) return fail("That outfit could not be found.", 404);

  const stored = await storeImage(userId, form.get("file"));
  if (!stored.ok) return fail(stored.error, stored.status);

  try {
    if (outfit.userId === userId) {
      await db.update(outfits).set({ imageUrl: stored.url }).where(and(eq(outfits.id, outfit.id), eq(outfits.userId, userId)));
      if (isBlobUrl(outfit.imageUrl)) await del(outfit.imageUrl).catch(() => undefined);
    } else {
      const items = await db.select().from(outfitItems).where(eq(outfitItems.outfitId, outfit.id));
      const copyId = randomUUID();
      await db.batch([
        db.insert(outfits).values({
          id: copyId,
          comboId: outfit.comboId,
          userId,
          title: outfit.title,
          style: "My Upload",
          season: outfit.season,
          imageUrl: stored.url,
          sortOrder: outfit.sortOrder,
        }),
        ...(items.length > 0
          ? [
              db.insert(outfitItems).values(
                items.map((i) => ({ outfitId: copyId, slot: i.slot, family: i.family, description: i.description })),
              ),
            ]
          : []),
        db.insert(hiddenOutfits).values({ userId, outfitId: outfit.id }).onConflictDoNothing(),
      ]);
    }
  } catch {
    await del(stored.url).catch(() => undefined);
    return fail("The photo could not be saved. Please try again.", 500);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
