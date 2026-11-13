/** True when the URL points at Vercel Blob storage (i.e. a user upload we may delete). */
export function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
