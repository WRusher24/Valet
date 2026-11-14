"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { closetOutfitItems, closetOutfits, wardrobeItems } from "@/db/schema";
import { blobDeleteTarget } from "@/lib/blob";
import { REQUIRED_CATEGORIES } from "@/lib/closet";
import { closetOutfitSchema, uuidSchema } from "@/lib/closet-schema";
import { createClosetOutfit } from "@/lib/closet-service";
import { SEASONS } from "@/lib/constants";
import { getUserOrNull } from "@/lib/session";

export type ClosetActionResult = { ok: true; id: string } | { ok: false; error: string };

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
  for (const category of [...REQUIRED_CATEGORIES, "outerwear"] as const) {
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

export async function deleteClosetOutfitAction(formData: FormData): Promise<void> {
  const user = await getUserOrNull();
  if (!user) redirect("/login");
  const id = uuidSchema.safeParse(formData.get("outfitId"));
  if (!id.success) return;
  await db.delete(closetOutfits).where(and(eq(closetOutfits.id, id.data), eq(closetOutfits.userId, user.id)));
  revalidatePath("/", "layout");
  redirect("/closet?view=outfits");
}

/** Deletes an item, its photo, and any saved outfit that used it (an outfit can't be missing a slot). */
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

  const dependents = await db
    .select({ outfitId: closetOutfitItems.outfitId })
    .from(closetOutfitItems)
    .where(eq(closetOutfitItems.itemId, id.data));
  const outfitIds = dependents.map((d) => d.outfitId);

  // Outfits first: if the second statement fails nothing is left half-built.
  if (outfitIds.length > 0) {
    await db.delete(closetOutfits).where(and(inArray(closetOutfits.id, outfitIds), eq(closetOutfits.userId, user.id)));
  }
  await db.delete(wardrobeItems).where(and(eq(wardrobeItems.id, id.data), eq(wardrobeItems.userId, user.id)));

  const target = blobDeleteTarget(item.imageUrl);
  if (target) await del(target).catch(() => undefined);
  revalidatePath("/", "layout");
  redirect("/closet");
}
