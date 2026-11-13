"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { del } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/db";
import { comboColors, combos, hiddenCombos, outfits } from "@/db/schema";
import { COLOR_FAMILIES, HEX_RE, parseSeasonFilter, SEASONS } from "@/lib/constants";
import { pickRandomComboId, UUID_RE } from "@/lib/queries";
import { getUserOrNull } from "@/lib/session";
import { isBlobUrl } from "@/lib/blob";

const createComboSchema = z.object({
  season: z.enum(SEASONS),
  colors: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Give every colour a name.").max(40),
        hex: z.string().regex(HEX_RE, "Invalid colour value."),
        family: z.enum(COLOR_FAMILIES),
      }),
    )
    .min(2, "Pick at least 2 colours.")
    .max(4, "A combination can have at most 4 colours."),
});

export type CreateComboResult = { ok: true; id: string } | { ok: false; error: string };

export async function createComboAction(input: unknown): Promise<CreateComboResult> {
  const user = await getUserOrNull();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };

  const parsed = createComboSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid combination." };
  const { colors, season } = parsed.data;

  const hexes = new Set(colors.map((c) => c.hex.toLowerCase()));
  if (hexes.size !== colors.length) return { ok: false, error: "Each colour in a combination must be distinct." };

  const id = randomUUID();
  await db.batch([
    db.insert(combos).values({
      id,
      userId: user.id,
      title: colors.map((c) => c.name).join(" + "),
      season,
    }),
    db.insert(comboColors).values(
      colors.map((c, position) => ({
        comboId: id,
        position,
        name: c.name,
        hex: c.hex.toUpperCase(),
        family: c.family,
      })),
    ),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, id };
}

export async function deleteComboAction(formData: FormData): Promise<void> {
  const user = await getUserOrNull();
  if (!user) redirect("/login");
  const id = String(formData.get("comboId") ?? "");
  if (!UUID_RE.test(id)) return;

  // Ownership is enforced in the WHERE clause: curated and other users' combos never match.
  const owned = await db
    .select({ imageUrl: outfits.imageUrl })
    .from(outfits)
    .innerJoin(combos, eq(combos.id, outfits.comboId))
    .where(and(eq(combos.id, id), eq(combos.userId, user.id)));
  const deleted = await db
    .delete(combos)
    .where(and(eq(combos.id, id), eq(combos.userId, user.id)))
    .returning({ id: combos.id });
  if (deleted.length > 0) {
    const urls = owned.map((o) => o.imageUrl).filter(isBlobUrl);
    if (urls.length > 0) await del(urls).catch(() => undefined);
  }
  if (deleted.length === 0) {
    // Not owned: if it's a starter combo, hide it from this user's view only.
    const starter = await db
      .select({ id: combos.id })
      .from(combos)
      .where(and(eq(combos.id, id), isNull(combos.userId)))
      .limit(1);
    if (starter[0]) await db.insert(hiddenCombos).values({ userId: user.id, comboId: id }).onConflictDoNothing();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function shuffleAction(formData: FormData): Promise<void> {
  const user = await getUserOrNull();
  if (!user) redirect("/login");
  const filter = parseSeasonFilter(String(formData.get("season") ?? "all"));
  const id = await pickRandomComboId(user.id, filter);
  if (!id) redirect(filter === "all" ? "/" : `/?season=${filter}`);
  redirect(`/combos/${id}`);
}
