"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, or } from "drizzle-orm";
import { del } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/db";
import { favorites, outfits, wearLogs } from "@/db/schema";
import { getUserOrNull } from "@/lib/session";
import { isBlobUrl } from "@/lib/blob";
import { UUID_RE } from "@/lib/queries";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const SESSION_EXPIRED = "Your session has expired. Please sign in again.";

/** Loads an outfit only if the user may see it (curated or their own). */
async function visibleOutfit(userId: string, outfitId: string) {
  if (!UUID_RE.test(outfitId)) return null;
  const [row] = await db
    .select({ id: outfits.id, comboId: outfits.comboId })
    .from(outfits)
    .where(and(eq(outfits.id, outfitId), or(isNull(outfits.userId), eq(outfits.userId, userId))))
    .limit(1);
  return row ?? null;
}

export async function toggleFavoriteAction(outfitId: string): Promise<ActionResult<{ favorited: boolean }>> {
  const user = await getUserOrNull();
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  const outfit = await visibleOutfit(user.id, outfitId);
  if (!outfit) return { ok: false, error: "This outfit is no longer available." };

  const removed = await db
    .delete(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.outfitId, outfit.id)))
    .returning({ outfitId: favorites.outfitId });
  let favorited = false;
  if (removed.length === 0) {
    await db.insert(favorites).values({ userId: user.id, outfitId: outfit.id }).onConflictDoNothing();
    favorited = true;
  }
  revalidatePath("/log");
  return { ok: true, favorited };
}

const wearSchema = z.object({
  outfitId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
});

export async function logWearAction(input: unknown): Promise<ActionResult<{ date: string }>> {
  const user = await getUserOrNull();
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  const parsed = wearSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const { outfitId, date } = parsed.data;
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return { ok: false, error: "Choose a valid date." };
  }
  // Allow for timezones: at most one day ahead of UTC "now".
  if (parsedDate.getTime() > Date.now() + 36 * 60 * 60 * 1000) {
    return { ok: false, error: "You can't log an outfit in the future." };
  }

  const outfit = await visibleOutfit(user.id, outfitId);
  if (!outfit) return { ok: false, error: "This outfit is no longer available." };

  const [existing] = await db
    .select({ id: wearLogs.id })
    .from(wearLogs)
    .where(and(eq(wearLogs.userId, user.id), eq(wearLogs.outfitId, outfit.id), eq(wearLogs.wornOn, date)))
    .limit(1);
  if (!existing) {
    await db.insert(wearLogs).values({ userId: user.id, outfitId: outfit.id, comboId: outfit.comboId, wornOn: date });
  }
  revalidatePath("/", "layout");
  return { ok: true, date };
}

export async function deleteWearLogAction(formData: FormData): Promise<void> {
  const user = await getUserOrNull();
  if (!user) return;
  const id = String(formData.get("logId") ?? "");
  if (!UUID_RE.test(id)) return;
  await db.delete(wearLogs).where(and(eq(wearLogs.id, id), eq(wearLogs.userId, user.id)));
  revalidatePath("/", "layout");
}

export async function deleteOutfitAction(formData: FormData): Promise<void> {
  const user = await getUserOrNull();
  if (!user) return;
  const id = String(formData.get("outfitId") ?? "");
  if (!UUID_RE.test(id)) return;
  // Only the owner can delete; curated outfits (user_id NULL) never match.
  const deleted = await db
    .delete(outfits)
    .where(and(eq(outfits.id, id), eq(outfits.userId, user.id)))
    .returning({ imageUrl: outfits.imageUrl });
  for (const row of deleted) {
    if (isBlobUrl(row.imageUrl)) await del(row.imageUrl).catch(() => undefined);
  }
  revalidatePath("/", "layout");
}
