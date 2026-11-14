"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClosetOutfitAction } from "@/app/actions/closet";
import {
  CATEGORY_META,
  OUTFIT_SLOT_ORDER,
  REQUIRED_CATEGORIES,
  buildSmartOutfit,
  paletteOf,
  type WardrobeCategory,
  type WardrobeFamily,
} from "@/lib/closet";
import { SEASONS, SEASON_LABEL, type Season } from "@/lib/constants";
import { ItemImage } from "./ItemImage";
import { Swatch } from "./Swatch";

export interface BuilderItem {
  id: string;
  imageUrl: string;
  category: WardrobeCategory;
  subTypeName: string;
  colorFamily: WardrobeFamily;
}

type Selection = Partial<Record<WardrobeCategory, string>>;

export function OutfitBuilder({ items, preselect }: { items: BuilderItem[]; preselect?: { category: WardrobeCategory; id: string } }) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>(preselect ? { [preselect.category]: preselect.id } : {});
  const [name, setName] = useState("");
  const [season, setSeason] = useState<Season>("all_season");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byCategory = useMemo(() => {
    const map = new Map<WardrobeCategory, BuilderItem[]>();
    for (const item of items) map.set(item.category, [...(map.get(item.category) ?? []), item]);
    return map;
  }, [items]);

  const chosen = OUTFIT_SLOT_ORDER.flatMap((c) => {
    const id = selection[c];
    const item = id ? items.find((i) => i.id === id) : undefined;
    return item ? [item] : [];
  });
  const palette = paletteOf(chosen);
  const missingRequired = REQUIRED_CATEGORIES.filter((c) => !selection[c]);

  function toggle(category: WardrobeCategory, id: string) {
    setSelection((prev) => {
      const next = { ...prev };
      if (next[category] === id) delete next[category];
      else next[category] = id;
      return next;
    });
  }

  function autoFill() {
    const { picked } = buildSmartOutfit(items, { includeOuterwear: season === "winter" || (byCategory.has("outerwear") && Math.random() < 0.4) });
    const next: Selection = {};
    for (const [category, item] of Object.entries(picked)) if (item) next[category as WardrobeCategory] = item.id;
    setSelection(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (missingRequired.length > 0) {
      setError(`Still needed: ${missingRequired.map((c) => CATEGORY_META[c].label.toLowerCase()).join(", ")}.`);
      return;
    }
    startTransition(async () => {
      const result = await createClosetOutfitAction({ name: name || undefined, season, items: selection });
      if (result.ok) router.push(`/closet/outfits/${result.id}`);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section aria-label="Palette preview" className="sticky top-0 z-20 -mx-4 border-b border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur">
        {palette.length === 0 ? (
          <p className="text-center text-xs uppercase tracking-editorial text-charcoal/50">Pick pieces to see your palette</p>
        ) : (
          <div className="mx-auto flex max-w-xs items-start justify-center gap-3">
            {palette.map((c) => (
              <Swatch key={c.hex} color={c} size="md" />
            ))}
          </div>
        )}
      </section>

      <button type="button" onClick={autoFill} disabled={items.length === 0} className="btn-outline w-full">
        ✦ Smart-fill from my closet
      </button>

      {OUTFIT_SLOT_ORDER.map((category) => {
        const options = byCategory.get(category) ?? [];
        const required = category !== "outerwear";
        return (
          <fieldset key={category}>
            <legend className="mb-2 flex w-full items-baseline justify-between">
              <span className="label !mb-0">{CATEGORY_META[category].label}</span>
              <span className="text-[11px] text-charcoal/50">{required ? "Required" : "Optional"}</span>
            </legend>
            {options.length === 0 ? (
              <Link
                href={`/closet/items/new?category=${category}`}
                className="block rounded-2xl border border-dashed border-charcoal/30 bg-surface p-5 text-center text-sm text-charcoal/70"
              >
                No {CATEGORY_META[category].plural.toLowerCase()} in your closet yet. <span className="underline">Add one →</span>
              </Link>
            ) : (
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {options.map((item) => {
                  const selected = selection[category] === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(category, item.id)}
                      aria-pressed={selected}
                      className={`w-28 shrink-0 overflow-hidden rounded-2xl border bg-white text-left transition ${
                        selected ? "border-obsidian ring-2 ring-obsidian" : "border-charcoal/15"
                      }`}
                    >
                      <ItemImage src={item.imageUrl} alt={item.subTypeName} fallbackLabel={CATEGORY_META[item.category].label} />
                      <span className="block truncate px-2 py-1.5 text-[11px] text-obsidian">{item.subTypeName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        );
      })}

      <div>
        <label htmlFor="outfit-name" className="label">Outfit name (optional)</label>
        <input id="outfit-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Monday client meeting" className="field" />
      </div>

      <div>
        <span className="label">Season</span>
        <div className="flex gap-2">
          {SEASONS.map((s) => (
            <button key={s} type="button" onClick={() => setSeason(s)} aria-pressed={season === s} className={`pill flex-1 justify-center ${season === s ? "pill-active" : ""}`}>
              {SEASON_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full !py-4">
        {pending ? "Saving…" : "Save Outfit"}
      </button>
    </form>
  );
}
