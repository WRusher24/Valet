import "server-only";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

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

/** Validates an uploaded image file and stores it in Vercel Blob under the user's folder. */
export async function storeImage(userId: string, file: unknown): Promise<StoreResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, status: 503, error: "Photo uploads aren't configured yet. Add BLOB_READ_WRITE_TOKEN to the environment." };
  }
  if (!(file instanceof File) || file.size === 0) return { ok: false, status: 400, error: "Choose a photo to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, status: 413, error: "That photo is too large. Please use an image under 4 MB." };
  const buffer = new Uint8Array(await file.arrayBuffer());
  const image = detectImage(buffer);
  if (!image) return { ok: false, status: 415, error: "Only JPEG, PNG or WebP photos are supported." };
  try {
    const blob = await put(`outfits/${userId}/${randomUUID()}.${image.ext}`, Buffer.from(buffer), {
      access: "public",
      contentType: image.type,
      addRandomSuffix: true,
    });
    return { ok: true, url: blob.url };
  } catch (err) {
    console.error("Vercel Blob upload failed:", err);
    const detail = err instanceof Error ? err.message.replace(/vercel_blob_rw_\w+/g, "[token]").slice(0, 240) : "";
    return {
      ok: false,
      status: 502,
      error: `The photo could not be stored.${detail ? ` Storage said: ${detail}` : ""}`,
    };
  }
}
