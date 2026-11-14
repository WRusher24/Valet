"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { prepareImage } from "@/lib/image";
import { CameraIcon } from "./icons";

interface ItemFormProps {
  mode: "create" | "edit";
  itemId?: string;
  initial?: { imageUrl: string; category: WardrobeCategory; subTypeName: string; colorFamily: WardrobeFamily };
  defaultCategory?: WardrobeCategory;
}

export function ItemForm({ mode, itemId, initial, defaultCategory }: ItemFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [category, setCategory] = useState<WardrobeCategory | "">(initial?.category ?? defaultCategory ?? "");
  const [name, setName] = useState(initial?.subTypeName ?? "");
  const [family, setFamily] = useState<WardrobeFamily | "">(initial?.colorFamily ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "create" && !file) return setError("Add a photo of the item.");
    if (!category) return setError("Choose a category.");
    if (!name.trim()) return setError("Give the item a name.");
    if (!family) return setError("Choose a colour family.");

    setBusy(true);
    try {
      const body = new FormData();
      body.set("meta", JSON.stringify({ category, subTypeName: name, colorFamily: family }));
      if (file) body.set("file", await prepareImage(file));
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
        <div className="flex aspect-square max-h-[340px] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-charcoal/30 bg-surface text-sm text-charcoal/70">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected item preview" className="h-full w-full object-cover" />
          ) : (
            <span className="px-6 text-center">Snap or upload a clear photo of the item<br /><span className="text-xs">JPEG, PNG or WebP</span></span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="btn-outline cursor-pointer">
            <CameraIcon /> Take photo
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="btn-outline cursor-pointer">
            Choose from library
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
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
      <button type="submit" disabled={busy} className="btn-primary w-full !py-4">
        {busy ? "Saving…" : mode === "create" ? "Add to Closet" : "Save Changes"}
      </button>
    </form>
  );
}
