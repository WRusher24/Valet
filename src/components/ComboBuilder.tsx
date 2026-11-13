"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createComboAction } from "@/app/actions/combos";
import {
  COLOR_FAMILIES,
  FAMILY_META,
  SEASONS,
  SEASON_LABEL,
  suggestFamilyFromHex,
  type ColorFamily,
  type Season,
} from "@/lib/constants";

interface Draft {
  name: string;
  hex: string;
  family: ColorFamily;
  familyTouched: boolean;
}

const INITIAL: Draft[] = [
  { name: "Navy", hex: "#1B263B", family: "blues", familyTouched: false },
  { name: "Camel", hex: "#C19A6B", family: "browns", familyTouched: false },
];

const EXTRA: Draft[] = [
  { name: "Crisp White", hex: "#FFFFFF", family: "whites", familyTouched: false },
  { name: "Charcoal", hex: "#36454F", family: "greys", familyTouched: false },
];

export function ComboBuilder() {
  const router = useRouter();
  const [colors, setColors] = useState<Draft[]>(INITIAL);
  const [season, setSeason] = useState<Season>("all_season");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(index: number, patch: Partial<Draft>) {
    setColors((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function setCount(count: number) {
    setColors((prev) => {
      if (count <= prev.length) return prev.slice(0, count);
      const next = [...prev];
      while (next.length < count) {
        const preset = EXTRA[next.length - 2];
        next.push({ ...(preset ?? EXTRA[0]!) });
      }
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createComboAction({
        season,
        colors: colors.map(({ name, hex, family }) => ({ name, hex, family })),
      });
      if (result.ok) router.push(`/combos/${result.id}`);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div>
        <span className="label">Number of colours</span>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              aria-pressed={colors.length === n}
              className={`pill flex-1 justify-center ${colors.length === n ? "pill-active" : ""}`}
            >
              {n} colours
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-center gap-4 rounded-2xl bg-surface px-4 py-6" aria-label="Palette preview">
        {colors.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="block h-20 w-10 rounded-full border border-bronze" style={{ backgroundColor: c.hex }} />
            <span className="max-w-[80px] truncate text-[11px] text-obsidian">{c.name || "Unnamed"}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {colors.map((c, i) => (
          <fieldset key={i} className="rounded-2xl border border-charcoal/15 p-4">
            <legend className="px-2 text-xs font-medium uppercase tracking-editorial text-bronze">Colour {i + 1}</legend>
            <div className="flex items-center gap-3">
              <label className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-bronze">
                <span className="sr-only">Pick colour {i + 1}</span>
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => {
                    const hex = e.target.value.toUpperCase();
                    update(i, { hex, ...(c.familyTouched ? {} : { family: suggestFamilyFromHex(hex) }) });
                  }}
                  className="absolute inset-0 h-full w-full scale-150"
                />
              </label>
              <div className="min-w-0 flex-1">
                <label htmlFor={`name-${i}`} className="sr-only">
                  Colour name
                </label>
                <input
                  id={`name-${i}`}
                  value={c.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  maxLength={40}
                  placeholder="Colour name, e.g. Camel"
                  required
                  className="field"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-wide text-charcoal/60">{c.hex}</p>
            <label htmlFor={`family-${i}`} className="label mt-3">
              Colour family
            </label>
            <select
              id={`family-${i}`}
              value={c.family}
              onChange={(e) => update(i, { family: e.target.value as ColorFamily, familyTouched: true })}
              className="field"
            >
              {COLOR_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {FAMILY_META[f].label}
                </option>
              ))}
            </select>
          </fieldset>
        ))}
      </div>

      <div>
        <span className="label">Season</span>
        <div className="flex gap-2">
          {SEASONS.map((s) => (
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

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full !py-4">
        {pending ? "Saving…" : "Save Combination"}
      </button>
    </form>
  );
}
