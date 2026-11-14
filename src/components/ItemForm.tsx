"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CATEGORY_META,
  WARDROBE_CATEGORIES,
  WARDROBE_FAMILIES,
  familyHex,
  familyLabel,
  familyShades,
  type WardrobeCategory,
  type WardrobeFamily,
} from "@/lib/closet";
import { removeBackgroundFromImage, type CutoutProgress } from "@/lib/background-removal";
import { prepareImage } from "@/lib/image";
import { RemoveBackgroundButton } from "./RemoveBackgroundButton";
import { Spinner } from "./Spinner";
import { CameraIcon } from "./icons";

interface ItemFormProps {
  mode: "create" | "edit";
  itemId?: string;
  initial?: { imageUrl: string; category: WardrobeCategory; subTypeName: string; colorFamily: WardrobeFamily };
  defaultCategory?: WardrobeCategory;
}

export function ItemForm({ mode, itemId, initial, defaultCategory }: ItemFormProps) {
  const router = useRouter();
  const [original, setOriginal] = useState<File | null>(null);
  const [cutout, setCutout] = useState<File | null>(null);
  const [autoRemove, setAutoRemove] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<CutoutProgress | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [category, setCategory] = useState<WardrobeCategory | "">(initial?.category ?? defaultCategory ?? "");
  const [name, setName] = useState(initial?.subTypeName ?? "");
  const [family, setFamily] = useState<WardrobeFamily | "">(initial?.colorFamily ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const runId = useRef(0);

  /** The file that will be uploaded and previewed: the cutout when enabled and ready, else the original. */
  const shown = autoRemove && cutout ? cutout : original;

  useEffect(() => {
    if (!shown) return;
    const url = URL.createObjectURL(shown);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [shown]);

  async function isolate(file: File) {
    const id = ++runId.current;
    setProcessing(true);
    setNotice(null);
    setCutout(null);
    setProgress({ fraction: 0, label: "Preparing photo…" });
    try {
      const result = await removeBackgroundFromImage(file, (p) => {
        if (runId.current === id) setProgress(p);
      });
      if (runId.current !== id) return;
      setCutout(result);
    } catch (err) {
      if (runId.current !== id) return;
      setNotice(`${err instanceof Error ? err.message : "Background removal failed."} The original photo will be used.`);
    } finally {
      if (runId.current === id) {
        setProcessing(false);
        setProgress(null);
      }
    }
  }

  function pick(file: File | null) {
    runId.current += 1; // abandon any run still in flight
    setOriginal(file);
    setCutout(null);
    setNotice(null);
    setProcessing(false);
    setProgress(null);
    if (file && autoRemove) void isolate(file);
  }

  function toggleAutoRemove(next: boolean) {
    setAutoRemove(next);
    setNotice(null);
    if (!next) {
      runId.current += 1; // cancel; keep the original
      setProcessing(false);
      setProgress(null);
    } else if (original && !cutout) {
      void isolate(original);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (processing) return setError("Still isolating the garment — one moment.");
    if (mode === "create" && !original) return setError("Add a photo of the item.");
    if (!category) return setError("Choose a category.");
    if (!name.trim()) return setError("Give the item a name.");
    if (!family) return setError("Choose a colour family.");

    setBusy(true);
    try {
      const body = new FormData();
      body.set("meta", JSON.stringify({ category, subTypeName: name, colorFamily: family }));
      if (autoRemove && cutout) body.set("file", cutout);
      else if (original) body.set("file", await prepareImage(original));
      const res = await fetch(mode === "create" ? "/api/closet" : `/api/closet/${itemId}`, {
        method: mode === "create" ? "POST" : "PUT",
        body,
      });
      const data = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "The item could not be saved. Please try again.");
        return;
      }
      router.push(category ? `/closet?category=${category}` : "/closet");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The item could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div>
        <span className="label">Photo</span>
        <div className="relative flex aspect-square max-h-[340px] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-charcoal/30 bg-surface text-sm text-charcoal/70">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected item preview" className="h-full w-full object-contain p-[7%] drop-shadow-sm" />
          ) : (
            <span className="px-6 text-center">Snap or upload a clear photo of the item<br /><span className="text-xs">JPEG, PNG or WebP</span></span>
          )}
          {processing && (
            <div role="status" aria-live="polite" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/90 px-8 text-center backdrop-blur-sm">
              <Spinner className="h-7 w-7 text-obsidian" />
              <p className="font-display text-xl text-obsidian">{progress?.label ?? "Isolating garment…"}</p>
              {progress?.fraction != null ? (
                <div className="h-1 w-40 overflow-hidden rounded-full bg-charcoal/15" role="progressbar" aria-valuenow={Math.round(progress.fraction * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-obsidian transition-all" style={{ width: `${Math.round(progress.fraction * 100)}%` }} />
                </div>
              ) : (
                <p className="text-[11px] uppercase tracking-editorial text-bronze">Cutting out the background</p>
              )}
              <p className="text-[11px] text-charcoal/60">Runs on your device. The first time can take a moment.</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="btn-outline cursor-pointer">
            <CameraIcon /> Take photo
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>
          <label className="btn-outline cursor-pointer">
            Choose from library
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-charcoal">
          <input
            type="checkbox"
            checked={autoRemove}
            onChange={(e) => toggleAutoRemove(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-obsidian"
          />
          <span>
            <span className="font-medium text-obsidian">Auto-remove background</span>
            <span className="block text-xs text-charcoal/60">Saves a clean transparent cutout of the item. Untick to keep the original photo.</span>
          </span>
        </label>
        {notice && <p role="status" className="mt-3 rounded-xl bg-surface px-4 py-3 text-xs text-charcoal/80">{notice}</p>}
        {mode === "edit" && itemId && initial && !original && (
          <div className="mt-4 border-t border-charcoal/10 pt-4">
            <p className="mb-2 text-xs text-charcoal/60">Already uploaded with a busy background? Clean up this photo in one tap.</p>
            <RemoveBackgroundButton
              itemId={itemId}
              imageUrl={initial.imageUrl}
              meta={{ category: initial.category, subTypeName: initial.subTypeName, colorFamily: initial.colorFamily }}
            />
          </div>
        )}
      </div>

      <div>
        <span className="label">Category</span>
        <div className="flex flex-wrap gap-2">
          {WARDROBE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`pill ${category === c ? "pill-active" : ""}`}
            >
              {CATEGORY_META[c].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="item-name" className="label">Name</label>
        <input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          placeholder="e.g. Brown Suede Loafers, Chronograph Watch"
          className="field"
        />
      </div>

      <div>
        <span className="label">Colour family</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WARDROBE_FAMILIES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFamily(f)}
              aria-pressed={family === f}
              className={`pill justify-start ${family === f ? "pill-active" : ""}`}
            >
              <span className="h-4 w-4 shrink-0 rounded-full border border-bronze" style={{ backgroundColor: familyHex(f) }} aria-hidden />
              {familyLabel(f)}
            </button>
          ))}
        </div>
        {family && <p className="mt-2 text-xs text-charcoal/60">Includes {familyShades(family)}.</p>}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
      )}
      <button type="submit" disabled={busy || processing} className="btn-primary w-full !py-4">
        {busy ? "Saving…" : processing ? "Isolating garment…" : mode === "create" ? "Add to Closet" : "Save Changes"}
      </button>
    </form>
  );
}
