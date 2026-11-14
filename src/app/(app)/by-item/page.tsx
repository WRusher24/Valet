import Link from "next/link";
import { ComboCard } from "@/components/ComboCard";
import { OutfitCard } from "@/components/OutfitCard";
import { PageHero } from "@/components/PageHero";
import {
  COLOR_FAMILIES,
  FAMILY_META,
  GARMENT_SLOTS,
  SLOT_META,
  isColorFamily,
  isGarmentSlot,
} from "@/lib/constants";
import { filterByItem } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "By Item" };

export default async function ByItemPage({
  searchParams,
}: {
  searchParams: Promise<{ slot?: string; family?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const slot = isGarmentSlot(sp.slot) ? sp.slot : null;
  const family = isColorFamily(sp.family) ? sp.family : null;
  const href = (s: string | null, f: string | null) => {
    const q = new URLSearchParams();
    if (s) q.set("slot", s);
    if (f) q.set("family", f);
    const qs = q.toString();
    return qs ? `/by-item?${qs}` : "/by-item";
  };

  const results = slot && family ? await filterByItem(user.id, slot, family) : null;

  return (
    <main>
      <PageHero eyebrow="What I want to wear" title="Build from One Piece">
        <p className="max-w-md text-sm text-white/70">
          Pick one garment and a broad colour family to see every palette and outfit that features it.
        </p>
        <Link href="/closet/match" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-obsidian">
          Or pick a piece from my closet →
        </Link>
      </PageHero>

      <div className="mx-auto max-w-3xl space-y-6 px-4 pt-6">
        <section aria-labelledby="slot-heading">
          <h2 id="slot-heading" className="label">1 · Garment</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GARMENT_SLOTS.map((s) => (
              <Link
                key={s}
                href={href(s, family)}
                aria-current={slot === s ? "true" : undefined}
                className={`pill justify-center text-center ${slot === s ? "pill-active" : ""}`}
              >
                {SLOT_META[s].label}
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="family-heading">
          <h2 id="family-heading" className="label">2 · Colour family</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COLOR_FAMILIES.map((f) => (
              <Link
                key={f}
                href={href(slot, f)}
                aria-current={family === f ? "true" : undefined}
                className={`pill justify-start ${family === f ? "pill-active" : ""}`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-bronze"
                  style={{ backgroundColor: FAMILY_META[f].hex }}
                  aria-hidden
                />
                {FAMILY_META[f].label}
              </Link>
            ))}
          </div>
          {family && (
            <p className="mt-2 text-xs text-charcoal/60">
              Includes {FAMILY_META[family].shades.join(", ")}.
            </p>
          )}
        </section>

        {!results && (
          <p className="rounded-2xl border border-dashed border-charcoal/25 bg-surface p-8 text-center text-charcoal/70">
            Choose a garment and a colour family to see matching outfits.
          </p>
        )}

        {results && slot && family && (
          <section aria-live="polite">
            <h2 className="text-2xl">
              {SLOT_META[slot].label} · {FAMILY_META[family].label}
            </h2>
            {results.outfits.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-surface p-8 text-center text-charcoal/70">
                No outfits match yet. Upload a photo and tag this piece to add one.
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs uppercase tracking-editorial text-charcoal/60">
                  {results.outfits.length} outfits · {results.combos.length} combinations
                </p>
                <h3 className="mt-6 text-lg">Matching palettes</h3>
                <div className="no-scrollbar -mx-4 mt-3 flex gap-4 overflow-x-auto px-4 pb-2">
                  {results.combos.map((c) => (
                    <div key={c.id} className="w-72 shrink-0">
                      <ComboCard combo={c} compact />
                    </div>
                  ))}
                </div>
                <h3 className="mt-6 text-lg">Outfits</h3>
                <div className="mt-3 grid gap-5 sm:grid-cols-2">
                  {results.outfits.map((o) => (
                    <OutfitCard key={o.id} outfit={o} highlight={{ slot, family }} showComboLink />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
