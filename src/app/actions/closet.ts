"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { closetWearLogs, savedClosetOutfits, wardrobeItems } from "@/db/schema";
import { blobDeleteTarget } from "@/lib/blob";
import { OUTFIT_SLOT_ORDER } from "@/lib/closet";
import { closetOutfitSchema, uuidSchema } from "@/lib/closet-schema";
import { z } from "zod";
import { createClosetOutfit } from "@/lib/closet-service";
import { SEASONS } from "@/lib/constants";
import { getUserOrNull } from "@/lib/session";

export type ClosetActionResult = { ok: true; id: string; comboId: string | null } | { ok: false; error: string };

const EXPIRED = "Your session has expired. Please sign in again.";

export async function createClosetOutfitAction(input: unknown): Promise<ClosetActionResult> {
  const user = await getUserOrNull();
  if (!user) return { ok: false, error: EXPIRED };
  const parsed = closetOutfitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick one item for every required slot." };
  const result = await createClosetOutfit(user.id, parsed.data);
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

/** Saves the outfit produced by the closet shuffle (item ids arrive as hidden form fields). */
export async function saveShuffledOutfitAction(formData: FormData): Promise<void> {
  const user = await getUserOrNull();
  if (!user) redirect("/login");

  const items: Record<string, string> = {};
  for (const category of OUTFIT_SLOT_ORDER) {
    const value = formData.get(`item_${category}`);
    if (typeof value === "string" && value) items[category] = value;
  }
  const seasonRaw = String(formData.get("season") ?? "all_season");
  const season = (SEASONS as readonly string[]).includes(seasonRaw) ? seasonRaw : "all_season";

  const parsed = closetOutfitSchema.safeParse({ season, items });
  if (!parsed.success) redirect("/shuffle/closet");
  const result = await createClosetOutfit(user.id, parsed.data);
  if (!result.ok) redirect("/shuffle/closet");
  revalidatePath("/", "layout");
  redirect(`/closet/outfits/${result.id}`);
}

const SAFE_RETURN = /^\/(?:combos\/[0-9a-f-]{36}|closet(?:\/[A-Za-z0-9/_?=&-]*)?|log(?:\?[A-Za-z0-9=&_-]*)?)$/;

function safeReturnPath(value: FormDataEntryValue | null, fallback: string): string {
  return typeof value === "string" && SAFE_RETURN.test(value) ? value : fallback;
}

export async function deleteClosetOutfitAction(formData: FormData): Promise<void> {
  const user = await getUserOrNull();
  if (!user) redirect("/login");
  const id = uuidSchema.safeParse(formData.get("outfitId"));
  if (!id.success) return;
  await db.delete(savedClosetOutfits).where(and(eq(savedClosetOutfits.id, id.data), eq(savedClosetOutfits.userId, user.id)));
  revalidatePath("/", "layout");
  redirect(safeReturnPath(formData.get("returnTo"), "/closet?view=outfits"));
}

const wearSchema = z.object({
  outfitId: uuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
});

/** "Wore This Today" for a saved closet outfit. */
export async function logClosetWearAction(input: unknown): Promise<{ ok: true; date: string } | { ok: false; error: string }> {
  const user = await getUserOrNull();
  if (!user) return { ok: false, error: EXPIRED };
  const parsed = wearSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  const { outfitId, date } = parsed.data;

  const when = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(when.getTime()) || when.toISOString().slice(0, 10) !== date) return { ok: false, error: "Choose a valid date." };
  if (when.getTime() > Date.now() + 36 * 60 * 60 * 1000) return { ok: false, error: "You can't log an outfit in the future." };

  const [outfit] = await db
    .select({ id: savedClosetOutfits.id })
    .from(savedClosetOutfits)
    .where(and(eq(savedClosetOutfits.id, outfitId), eq(savedClosetOutfits.userId, user.id)))
    .limit(1);
  if (!outfit) return { ok: false, error: "This outfit is no longer available." };

  const [existing] = await db
    .select({ id: closetWearLogs.id })
    .from(closetWearLogs)
    .where(and(eq(closetWearLogs.userId, user.id), eq(closetWearLogs.savedOutfitId, outfitId), eq(closetWearLogs.wornOn, date)))
    .limit(1);
  if (!existing) await db.insert(closetWearLogs).values({ userId: user.id, savedOutfitId: outfitId, wornOn: date });
  revalidatePath("/", "layout");
  return { ok: true, date };
}

export async function deleteClosetWearLogAction(formData: FormData): Promise<void> {
  const user = await getUserOrNull();
  if (!user) return;
  const id = uuidSchema.safeParse(formData.get("logId"));
  if (!id.success) return;
  await db.delete(closetWearLogs).where(and(eq(closetWearLogs.id, id.data), eq(closetWearLogs.userId, user.id)));
  revalidatePath("/", "layout");
}

/** Deletes an item and its photo. */
export async function deleteClosetItemAction(formData: FormData): Promise<void> {
  const user = await getUserOrNull();
  if (!user) redirect("/login");
  const id = uuidSchema.safeParse(formData.get("itemId"));
  if (!id.success) return;

  const [item] = await db
    .select({ imageUrl: wardrobeItems.imageUrl })
    .from(wardrobeItems)
    .where(and(eq(wardrobeItems.id, id.data), eq(wardrobeItems.userId, user.id)))
    .limit(1);
  if (!item) redirect("/closet");

  // The database does the rest: outfits that used this item as a required slot (top, bottom,
  // shoes) are removed, and outfits that used it as an optional piece simply lose that piece.
  await db.delete(wardrobeItems).where(and(eq(wardrobeItems.id, id.data), eq(wardrobeItems.userId, user.id)));

  const target = blobDeleteTarget(item.imageUrl);
  if (target) await del(target).catch(() => undefined);
  revalidatePath("/", "layout");
  redirect("/closet");
}
