"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createClosetOutfitAction } from "@/app/actions/closet";
import {
  CATEGORY_META,
  OUTFIT_SLOT_ORDER,
  REQUIRED_CATEGORIES,
  buildSmartOutfit,
  isRequiredCategory,
  paletteOf,
  toLookbookFamilies,
  type WardrobeCategory,
  type WardrobeFamily,
} from "@/lib/closet";
import { SEASONS, SEASON_LABEL, type ColorFamily, type Season } from "@/lib/constants";
import { ItemImage } from "./ItemImage";
import { Swatch } from "./Swatch";

export interface BuilderItem {
  id: string;
  imageUrl: string;
  category: WardrobeCategory;
  subTypeName: string;
  colorFamily: WardrobeFamily;
}

export interface BuilderCombo {
  id: string;
  title: string;
  season: Season;
  colors: { hex: string; family: ColorFamily }[];
}

type Selection = Partial<Record<WardrobeCategory, string>>;

const COLLAPSED_COMBOS = 8;

interface OutfitBuilderProps {
  items: BuilderItem[];
  combos: BuilderCombo[];
  preselect?: { category: WardrobeCategory; id: string };
  initialComboId?: string;
}

export function OutfitBuilder({ items, combos, preselect, initialComboId }: OutfitBuilderProps) {
  const router = useRouter();
  const initialCombo = combos.find((c) => c.id === initialComboId);
  const [comboId, setComboId] = useState<string | null>(initialCombo?.id ?? null);
  const [showAll, setShowAll] = useState(false);
  const [showAllCombos, setShowAllCombos] = useState(false);
  const [selection, setSelection] = useState<Selection>(preselect ? { [preselect.category]: preselect.id } : {});
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [season, setSeason] = useState<Season>(initialCombo?.season ?? "all_season");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const activeCombo = combos.find((c) => c.id === comboId) ?? null;
  const comboFamilies = useMemo(() => new Set(activeCombo?.colors.map((c) => c.family) ?? []), [activeCombo]);

  const matches = (item: BuilderItem): boolean =>
    activeCombo === null || toLookbookFamilies(item.colorFamily).some((f) => comboFamilies.has(f));

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
  const visibleCombos = showAllCombos ? combos : combos.slice(0, COLLAPSED_COMBOS);
  const filtering = activeCombo !== null && !showAll;

  function selectCombo(id: string) {
    if (comboId === id) {
      setComboId(null);
      return;
    }
    setComboId(id);
    const combo = combos.find((c) => c.id === id);
    if (combo) setSeason(combo.season);
  }

  function toggle(category: WardrobeCategory, id: string) {
    setSelection((prev) => {
      const next = { ...prev };
      if (next[category] === id) delete next[category];
      else next[category] = id;
      return next;
    });
  }

  function autoFill() {
    const includeOuterwear = season === "winter" || (byCategory.has("outerwear") && Math.random() < 0.4);
    let pool = filtering ? items.filter(matches) : items;
    let result = buildSmartOutfit(pool, { includeOuterwear });
    if (result.missing.length > 0 && pool !== items) {
      pool = items;
      result = buildSmartOutfit(pool, { includeOuterwear });
    }
    const next: Selection = {};
    for (const [category, item] of Object.entries(result.picked)) if (item) next[category as WardrobeCategory] = item.id;
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
      const result = await createClosetOutfitAction({
        name: name || undefined,
        notes: notes || undefined,
        season,
        comboId,
        items: selection,
      });
      if (!result.ok) return setError(result.error);
      router.push(result.comboId ? `/combos/${result.comboId}` : `/closet/outfits/${result.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Minimalist colour reference */}
      <section aria-labelledby="palette-heading">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 id="palette-heading" className="label !mb-0">Colour palette</h2>
          <span className="text-[11px] text-charcoal/50">Optional · tap to match</span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {visibleCombos.map((combo) => {
            const selected = combo.id === comboId;
            return (
              <button
                key={combo.id}
                type="button"
                onClick={() => selectCombo(combo.id)}
                aria-pressed={selected}
                aria-label={`Palette: ${combo.title}`}
                className={`flex aspect-[5/4] overflow-hidden rounded-lg border transition ${
                  selected ? "border-obsidian ring-2 ring-obsidian ring-offset-2" : "border-charcoal/15"
                }`}
              >
                {combo.colors.map((c, i) => (
                  <span key={`${c.hex}-${i}`} className="h-full flex-1" style={{ backgroundColor: c.hex }} />
                ))}
              </button>
            );
          })}
        </div>
        {combos.length > COLLAPSED_COMBOS && (
          <button type="button" onClick={() => setShowAllCombos((v) => !v)} className="mt-2 text-xs text-charcoal/70 underline underline-offset-2">
            {showAllCombos ? "Show fewer palettes" : `Show all ${combos.length} palettes`}
          </button>
        )}
        {activeCombo && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2.5 text-xs text-charcoal/80">
            <span>
              {filtering ? "Showing items that match this palette." : "Showing all items; matches are highlighted."}
            </span>
            <span className="flex gap-3">
              <button type="button" onClick={() => setShowAll((v) => !v)} className="font-medium text-obsidian underline underline-offset-2">
                {showAll ? "Matching only" : "Show All Items"}
              </button>
              <button type="button" onClick={() => setComboId(null)} className="underline underline-offset-2">Clear</button>
            </span>
          </div>
        )}
      </section>

      <section aria-label="Your outfit palette" className="sticky top-0 z-20 -mx-4 border-b border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur">
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
        const all = byCategory.get(category) ?? [];
        const options = filtering ? all.filter((i) => matches(i) || selection[category] === i.id) : all;
        const required = isRequiredCategory(category);
        return (
          <fieldset key={category}>
            <legend className="mb-2 flex w-full items-baseline justify-between">
              <span className="label !mb-0">{CATEGORY_META[category].label}</span>
              <span className={`text-[11px] ${required ? "font-medium text-obsidian" : "text-charcoal/50"}`}>
                {required ? "Required" : "Optional"}
              </span>
            </legend>
            {all.length === 0 ? (
              <Link
                href={`/closet/items/new?category=${category}`}
                className="block rounded-2xl border border-dashed border-charcoal/30 bg-surface p-5 text-center text-sm text-charcoal/70"
              >
                No {CATEGORY_META[category].plural.toLowerCase()} in your closet yet. <span className="underline">Add one →</span>
              </Link>
            ) : options.length === 0 ? (
              <p className="rounded-2xl bg-surface p-5 text-center text-sm text-charcoal/70">
                No {CATEGORY_META[category].plural.toLowerCase()} match this palette.{" "}
                <button type="button" onClick={() => setShowAll(true)} className="underline">Show All Items</button>
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {options.map((item) => {
                  const selected = selection[category] === item.id;
                  const isMatch = activeCombo !== null && matches(item);
                  const dimmed = activeCombo !== null && !isMatch && !selected;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(category, item.id)}
                      aria-pressed={selected}
                      className={`relative overflow-hidden rounded-2xl border bg-white text-left transition ${
                        selected ? "border-obsidian ring-2 ring-obsidian" : isMatch ? "border-bronze" : "border-charcoal/15"
                      } ${dimmed ? "opacity-45" : ""}`}
                    >
                      <ItemImage src={item.imageUrl} alt={item.subTypeName} fallbackLabel={CATEGORY_META[item.category].label} />
                      {isMatch && !selected && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-bronze px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">Match</span>
                      )}
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-obsidian text-[11px] text-white" aria-hidden>✓</span>
                      )}
                      <span className="line-clamp-2 block px-2 py-1.5 text-xs leading-snug text-obsidian">{item.subTypeName}</span>
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
        <label htmlFor="outfit-notes" className="label">Notes (optional)</label>
        <textarea id="outfit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} placeholder="Where you'll wear it, what to remember…" className="field" />
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
        {pending ? "Saving…" : activeCombo ? "Save to This Palette" : "Save Outfit"}
      </button>
    </form>
  );
}
