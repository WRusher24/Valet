import { get } from "@vercel/blob";
import { auth } from "@/auth";

export const runtime = "nodejs";

/** Streams a private Blob photo, but only to the user who uploaded it. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const segments = (await params).path;
  if (segments.some((s) => s === ".." || s === "." || s === "")) return new Response("Not found", { status: 404 });
  const pathname = segments.map(decodeURIComponent).join("/");
  if (!pathname.startsWith(`outfits/${userId}/`)) return new Response("Not found", { status: 404 });

  const result = await get(pathname, { access: "private" }).catch(() => null);
  if (!result || result.statusCode !== 200) return new Response("Not found", { status: 404 });

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
