import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/db";
import { wardrobeItems } from "@/db/schema";
import { blobDeleteTarget } from "@/lib/blob";
import { itemMetaSchema, uuidSchema } from "@/lib/closet-schema";
import { storeImage } from "@/lib/upload";

export const runtime = "nodejs";
export const maxDuration = 30;

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

/** Edits an item's details and, optionally, swaps its photo. Only the owner can edit. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return fail("Your session has expired. Please sign in again.", 401);

  const id = uuidSchema.safeParse((await params).id);
  if (!id.success) return fail("That item could not be found.", 404);

  const [existing] = await db
    .select({ imageUrl: wardrobeItems.imageUrl })
    .from(wardrobeItems)
    .where(and(eq(wardrobeItems.id, id.data), eq(wardrobeItems.userId, userId)))
    .limit(1);
  if (!existing) return fail("That item could not be found.", 404);

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

  const file = form.get("file");
  let newUrl: string | undefined;
  if (file instanceof File && file.size > 0) {
    const stored = await storeImage(userId, file, "closet");
    if (!stored.ok) return fail(stored.error, stored.status);
    newUrl = stored.url;
  }

  try {
    await db
      .update(wardrobeItems)
      .set({ ...meta.data, ...(newUrl ? { imageUrl: newUrl } : {}) })
      .where(and(eq(wardrobeItems.id, id.data), eq(wardrobeItems.userId, userId)));
  } catch {
    const created = newUrl ? blobDeleteTarget(newUrl) : null;
    if (created) await del(created).catch(() => undefined);
    return fail("The item could not be saved. Please try again.", 500);
  }

  if (newUrl) {
    const old = blobDeleteTarget(existing.imageUrl);
    if (old) await del(old).catch(() => undefined);
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
