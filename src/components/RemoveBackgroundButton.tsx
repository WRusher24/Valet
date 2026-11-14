"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeBackgroundFromImage, type CutoutProgress } from "@/lib/background-removal";
import type { WardrobeCategory, WardrobeFamily } from "@/lib/closet";
import { Spinner } from "./Spinner";

interface Props {
  itemId: string;
  imageUrl: string;
  meta: { category: WardrobeCategory; subTypeName: string; colorFamily: WardrobeFamily };
}

/**
 * One-click cleanup for an existing closet photo: fetch it, cut out the background on-device,
 * upload the transparent PNG (the API deletes the old blob) and refresh the page.
 */
export function RemoveBackgroundButton({ itemId, imageUrl, meta }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<CutoutProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setBusy(true);
    setProgress({ fraction: 0, label: "Fetching photo…" });
    try {
      const res = await fetch(imageUrl, { credentials: "same-origin" });
      if (!res.ok) throw new Error("We couldn't load the current photo. Please try again.");
      const original = await res.blob();
      const cutout = await removeBackgroundFromImage(original, setProgress);

      setProgress({ fraction: null, label: "Saving…" });
      const body = new FormData();
      body.set("meta", JSON.stringify(meta));
      body.set("file", cutout);
      const save = await fetch(`/api/closet/${itemId}`, { method: "PUT", body });
      const data = (await save.json().catch(() => null)) as { ok: boolean; error?: string } | null;
      if (!save.ok || !data?.ok) throw new Error(data?.error ?? "The new photo could not be saved. Please try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Background removal failed. Please try again.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div>
      <button type="button" onClick={run} disabled={busy} className="btn-outline">
        {busy ? <Spinner className="h-4 w-4" /> : <span aria-hidden>✂</span>}
        {busy ? (progress?.label ?? "Working…") : "Remove Background"}
      </button>
      {busy && progress?.fraction != null && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-charcoal/10" role="progressbar" aria-valuenow={Math.round(progress.fraction * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-obsidian transition-all" style={{ width: `${Math.round(progress.fraction * 100)}%` }} />
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-800">{error}</p>}
    </div>
  );
}
