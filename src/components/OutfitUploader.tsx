"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  COLOR_FAMILIES,
  FAMILY_META,
  GARMENT_SLOTS,
  OUTFIT_SEASONS,
  SEASON_LABEL,
  SLOT_META,
  isColorFamily,
  type ColorFamily,
  type GarmentSlot,
} from "@/lib/constants";

interface ComboOption {
  id: string;
  title: string;
  isOwn: boolean;
}

interface PieceDraft {
  family: ColorFamily | "";
  description: string;
}

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 1600;

/** Downscales large phone photos so they stay under the serverless body limit. */
async function prepare(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 2.5 * 1024 * 1024 && /^image\/(jpeg|png|webp)$/.test(file.type)) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.86));
    if (!blob) throw new Error("encode failed");
    return new File([blob], "outfit.jpg", { type: "image/jpeg" });
  } catch {
    if (/^image\/(jpeg|png|webp)$/.test(file.type) && file.size <= MAX_BYTES) return file;
    throw new Error("We couldn't read that photo. Please use a JPEG, PNG or WebP image under 4 MB.");
  }
}

export function OutfitUploader({ combos, defaultComboId }: { combos: ComboOption[]; defaultComboId?: string }) {
  const router = useRouter();
  const [comboId, setComboId] = useState(
    combos.some((c) => c.id === defaultComboId) ? (defaultComboId as string) : (combos[0]?.id ?? ""),
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [season, setSeason] = useState<(typeof OUTFIT_SEASONS)[number]>("summer");
  const [pieces, setPieces] = useState<Record<GarmentSlot, PieceDraft>>({
    top: { family: "", description: "" },
    layer: { family: "", description: "" },
    bottom: { family: "", description: "" },
    shoes: { family: "", description: "" },
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function setPiece(slot: GarmentSlot, patch: Partial<PieceDraft>) {
    setPieces((p) => ({ ...p, [slot]: { ...p[slot], ...patch } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Choose a photo to upload.");
    const items = GARMENT_SLOTS.flatMap((slot) => {
      const p = pieces[slot];
      return p.family ? [{ slot, family: p.family, description: p.description.trim() }] : [];
    });
    if (items.length === 0) return setError("Tag at least one garment with a colour family.");

    setBusy(true);
    try {
      const upload = await prepare(file);
      const body = new FormData();
      body.set("file", upload);
      body.set("meta", JSON.stringify({ comboId, title, season, items }));
      const res = await fetch("/api/outfits", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "The upload failed. Please try again.");
        return;
      }
      router.push(`/combos/${comboId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (combos.length === 0) {
    return <p className="text-charcoal/70">No combinations are available yet.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div>
        <label htmlFor="combo" className="label">Colour combination</label>
        <select id="combo" value={comboId} onChange={(e) => setComboId(e.target.value)} className="field">
          {combos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.isOwn ? "★ " : ""}
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="photo" className="label">Outfit photo</label>
        <label
          htmlFor="photo"
          className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-charcoal/30 bg-surface text-center text-sm text-charcoal/70"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected outfit preview" className="max-h-[360px] w-full object-cover" />
          ) : (
            <span className="px-6 py-10">Tap to choose a full-outfit photo<br /><span className="text-xs">JPEG, PNG or WebP</span></span>
          )}
        </label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </div>

      <div>
        <label htmlFor="title" className="label">Outfit title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          placeholder="e.g. Monday client meeting"
          className="field"
        />
      </div>

      <div>
        <span className="label">Season</span>
        <div className="flex gap-2">
          {OUTFIT_SEASONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              aria-pressed={season === s}
              className={`pill flex-1 justify-center ${season === s ? "pill-active" : ""}`}
            >
              {SEASON_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">Tag the pieces</span>
        <p className="mb-3 text-xs text-charcoal/60">
          Tagged pieces feed the “By Item” filter. Leave a piece on “Not visible” to skip it.
        </p>
        <div className="space-y-3">
          {GARMENT_SLOTS.map((slot) => {
            const p = pieces[slot];
            return (
              <fieldset key={slot} className="rounded-2xl border border-charcoal/15 p-4">
                <legend className="px-2 text-xs font-medium uppercase tracking-editorial text-bronze">
                  {SLOT_META[slot].label}
                </legend>
                <select
                  aria-label={`${SLOT_META[slot].label} colour family`}
                  value={p.family}
                  onChange={(e) => setPiece(slot, { family: isColorFamily(e.target.value) ? e.target.value : "" })}
                  className="field"
                >
                  <option value="">Not visible</option>
                  {COLOR_FAMILIES.map((f) => (
                    <option key={f} value={f}>
                      {FAMILY_META[f].label}
                    </option>
                  ))}
                </select>
                {p.family && (
                  <input
                    aria-label={`${SLOT_META[slot].label} description`}
                    value={p.description}
                    onChange={(e) => setPiece(slot, { description: e.target.value })}
                    maxLength={80}
                    placeholder="Brief description, e.g. Sand Chinos"
                    className="field mt-2"
                  />
                )}
              </fieldset>
            );
          })}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full !py-4">
        {busy ? "Uploading…" : "Upload Outfit"}
      </button>
    </form>
  );
}
