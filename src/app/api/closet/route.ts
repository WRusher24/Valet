import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/db";
import { wardrobeItems } from "@/db/schema";
import { blobDeleteTarget } from "@/lib/blob";
import { itemMetaSchema, MAX_CLOSET_ITEMS } from "@/lib/closet-schema";
import { storeImage } from "@/lib/upload";

export const runtime = "nodejs";
export const maxDuration = 30;

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

/** Adds a new wardrobe item: photo (Vercel Blob) + category, name and colour family. */
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

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("meta") ?? ""));
  } catch {
    return fail("Item details are missing.", 400);
  }
  const meta = itemMetaSchema.safeParse(raw);
  if (!meta.success) return fail(meta.error.issues[0]?.message ?? "Invalid item details.", 400);

  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(wardrobeItems)
    .where(eq(wardrobeItems.userId, userId));
  if (n >= MAX_CLOSET_ITEMS) return fail(`Your closet is full (${MAX_CLOSET_ITEMS} items). Delete something first.`, 409);

  const stored = await storeImage(userId, form.get("file"), "closet");
  if (!stored.ok) return fail(stored.error, stored.status);

  try {
    const [row] = await db
      .insert(wardrobeItems)
      .values({ userId, imageUrl: stored.url, ...meta.data })
      .returning({ id: wardrobeItems.id });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, id: row?.id });
  } catch {
    const created = blobDeleteTarget(stored.url);
    if (created) await del(created).catch(() => undefined);
    return fail("The item could not be saved. Please try again.", 500);
  }
}
