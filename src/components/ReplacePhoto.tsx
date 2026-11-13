"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { prepareImage } from "@/lib/image";

export function ReplacePhoto({ outfitId, isOwn }: { outfitId: string; isOwn: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const upload = await prepareImage(file);
      const body = new FormData();
      body.set("outfitId", outfitId);
      body.set("file", upload);
      const res = await fetch("/api/outfits/replace", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) setError(data?.error ?? "The upload failed. Please try again.");
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        title={isOwn ? "Swap this photo" : "Replace this starter photo with your own"}
        className="inline-flex items-center gap-1.5 text-xs text-charcoal/70 underline-offset-2 hover:text-obsidian hover:underline disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Replace photo"}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {error && <p role="alert" className="mt-1 text-xs text-red-800">{error}</p>}
    </div>
  );
}
