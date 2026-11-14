import Link from "next/link";
import { saveShuffledOutfitAction } from "@/app/actions/closet";
import { ItemImage } from "@/components/ItemImage";
import { PageHero } from "@/components/PageHero";
import { SeasonTag } from "@/components/SeasonTag";
import { Swatch } from "@/components/Swatch";
import { ShuffleIcon } from "@/components/icons";
import {
  CATEGORY_META,
  OUTFIT_SLOT_ORDER,
  buildSmartOutfit,
  familyHex,
  paletteOf,
} from "@/lib/closet";
import { listItems } from "@/lib/closet-queries";
import { parseSeasonFilter, type Season } from "@/lib/constants";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Closet Shuffle" };

export default async function ClosetShufflePage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const user = await requireUser();
  const filter = parseSeasonFilter((await searchParams).season);
  const items = await listItems(user.id);

  const includeOuterwear = filter === "winter" ? true : filter === "summer" ? false : Math.random() < 0.4;
  const { picked, missing } = buildSmartOutfit(items, { includeOuterwear });
  const pieces = OUTFIT_SLOT_ORDER.flatMap((c) => picked[c] ?? []);
  const season: Season = filter === "all" ? (picked.outerwear ? "winter" : "all_season") : filter;
  const nonce = Math.random().toString(36).slice(2);

  return (
    <main>
      <PageHero eyebrow="Smart shuffle" title="Today from Your Closet" />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Link href="/shuffle" className="mb-5 inline-block text-xs uppercase tracking-editorial text-bronze">← Shuffle options</Link>

        {missing.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-charcoal/25 bg-surface p-8 text-center">
            <p className="font-display text-xl text-obsidian">Your closet needs a few more pieces</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-charcoal/70">
              An outfit needs at least a top, bottom and shoes. Still missing:{" "}
              {missing.map((c) => CATEGORY_META[c].plural.toLowerCase()).join(", ")}.
            </p>
            <Link href={`/closet/items/new?category=${missing[0]}`} className="btn-primary mt-5">+ Add {CATEGORY_META[missing[0] ?? "top"].label.toLowerCase()}</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <SeasonTag season={season} />
              <span className="text-xs text-charcoal/60">{pieces.length} pieces, matched for colour harmony</span>
            </div>
            <div className="mt-4 flex items-stretch gap-3 rounded-2xl bg-surface p-4">
              {paletteOf(pieces).map((c) => (
                <Swatch key={c.hex} color={c} size="fill" />
              ))}
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {pieces.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
                  <ItemImage src={item.imageUrl} alt={item.subTypeName} fallbackLabel={CATEGORY_META[item.category].label} fallbackHex={familyHex(item.colorFamily)} priority />
                  <div className="space-y-1 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-editorial text-bronze">{CATEGORY_META[item.category].label}</p>
                    <p className="text-sm font-medium leading-snug text-obsidian">{item.subTypeName}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <form action="/shuffle/closet" method="get" className="flex-1">
                <input type="hidden" name="season" value={filter} />
                <input type="hidden" name="n" value={nonce} />
                <button type="submit" className="btn-primary w-full !py-4"><ShuffleIcon /> Shuffle again</button>
              </form>
              <form action={saveShuffledOutfitAction} className="flex-1">
                {OUTFIT_SLOT_ORDER.map((c) => {
                  const item = picked[c];
                  return item ? <input key={c} type="hidden" name={`item_${c}`} value={item.id} /> : null;
                })}
                <input type="hidden" name="season" value={season} />
                <button type="submit" className="btn-outline w-full !py-4">Save this outfit</button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
