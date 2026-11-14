import "server-only";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { PHOTO_ROUTE } from "./blob";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel serverless request bodies are capped at 4.5 MB.

export function detectImage(b: Uint8Array): { ext: string; type: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { ext: "webp", type: "image/webp" };
  }
  return null;
}

export type StoreResult = { ok: true; url: string } | { ok: false; error: string; status: number };

/** Remembered per server instance once we learn whether the Blob store is private. */
let detectedAccess: "public" | "private" | undefined;

function configuredAccess(): "public" | "private" | undefined {
  const v = process.env.BLOB_ACCESS?.toLowerCase();
  return v === "public" || v === "private" ? v : undefined;
}

async function putWithAccess(pathname: string, body: Buffer, contentType: string, access: "public" | "private") {
  return put(pathname, body, { access, contentType, addRandomSuffix: true });
}

/**
 * Validates an uploaded image file and stores it in Vercel Blob under the user's folder.
 * Works with both public and private stores. Private stores return a same-origin
 * `/api/photos/...` reference that is served only to the owner.
 */
export async function storeImage(
  userId: string,
  file: unknown,
  folder: "outfits" | "closet" = "outfits",
): Promise<StoreResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, status: 503, error: "Photo uploads aren't configured yet. Add BLOB_READ_WRITE_TOKEN to the environment." };
  }
  if (!(file instanceof File) || file.size === 0) return { ok: false, status: 400, error: "Choose a photo to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, status: 413, error: "That photo is too large. Please use an image under 4 MB." };
  const buffer = new Uint8Array(await file.arrayBuffer());
  const image = detectImage(buffer);
  if (!image) return { ok: false, status: 415, error: "Only JPEG, PNG or WebP photos are supported." };

  const pathname = `${folder}/${userId}/${randomUUID()}.${image.ext}`;
  const body = Buffer.from(buffer);
  const first = configuredAccess() ?? detectedAccess ?? "public";
  const order: ("public" | "private")[] = first === "public" ? ["public", "private"] : ["private", "public"];

  let lastError: unknown;
  for (const access of order) {
    try {
      const blob = await putWithAccess(pathname, body, image.type, access);
      detectedAccess = access;
      return { ok: true, url: access === "private" ? `${PHOTO_ROUTE}${blob.pathname}` : blob.url };
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : "";
      // Only fall back to the other access mode when the store told us its mode is different.
      if (!/private|public/i.test(message) || configuredAccess()) break;
    }
  }
  console.error("Vercel Blob upload failed:", lastError);
  const detail = lastError instanceof Error ? lastError.message.replace(/vercel_blob_rw_\w+/g, "[token]").slice(0, 240) : "";
  return {
    ok: false,
    status: 502,
    error: `The photo could not be stored.${detail ? ` Storage said: ${detail}` : ""}`,
  };
}
