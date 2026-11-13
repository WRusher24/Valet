/** Same-origin route that streams a user's photos from a private Blob store. */
export const PHOTO_ROUTE = "/api/photos/";

/**
 * Returns the value to pass to `del()` for a user-uploaded photo, or null for
 * anything that isn't ours to delete (e.g. starter library Unsplash URLs).
 */
export function blobDeleteTarget(url: string): string | null {
  if (url.startsWith(PHOTO_ROUTE)) return url.slice(PHOTO_ROUTE.length);
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com") ? url : null;
  } catch {
    return null;
  }
}
