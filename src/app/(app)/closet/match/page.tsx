import Link from "next/link";
import { ClosetItemCard } from "@/components/ClosetItemCard";
import { ClosetOutfitCard } from "@/components/ClosetOutfitCard";
import { ComboCard } from "@/components/ComboCard";
import { ItemImage } from "@/components/ItemImage";
import { OutfitCard } from "@/components/OutfitCard";
import { PageHero } from "@/components/PageHero";
import {
  CATEGORY_META,
  OUTFIT_SLOT_ORDER,
  familiesCompatible,
  familyHex,
  familyLabel,
  toLookbookFamily,
  type WardrobeCategory,
} from "@/lib/closet";
import { uuidSchema } from "@/lib/closet-schema";
import { listItems, listOutfitsUsingItem, type ClosetItem } from "@/lib/closet-queries";
import type { GarmentSlot } from "@/lib/constants";
import { filterByItem, listCombosWithFamily, type ComboSummary, type OutfitView } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Find Matches" };

/** Which lookbook garment slot a closet category is compared against (null = palette match only). */
const LOOKBOOK_SLOT: Record<WardrobeCategory, GarmentSlot | null> = {
  top: "top",
  bottom: "bottom",
  outerwear: "layer",
  shoes: "shoes",
  belt: "shoes", // a belt is matched against shoes
  watch: null,
  bracelet: null,
};

export default async function MatchPage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse((await searchParams).item);
  const items = await listItems(user.id);
  const selected = parsed.success ? items.find((i) => i.id === parsed.data) : undefined;

  return (
    <main>
      <PageHero eyebrow="What I want to wear" title="Match One Piece">
        <p className="max-w-md text-sm text-white/70">
          Pick a single belt, watch, shirt or shoe from your closet and see every outfit and palette that works with it.
        </p>
      </PageHero>
      <div className="mx-auto max-w-3xl space-y-8 px-4 pt-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-charcoal/25 bg-surface p-10 text-center">
            <p className="font-display text-xl text-obsidian">Your closet is empty</p>
            <Link href="/closet/items/new" className="btn-primary mt-5">+ Add your first item</Link>
          </div>
        ) : (
          <Picker items={items} selectedId={selected?.id} />
        )}
        {selected && <Results userId={user.id} selected={selected} items={items} />}
        {!selected && items.length > 0 && (
          <p className="rounded-2xl border border-dashed border-charcoal/25 bg-surface p-8 text-center text-charcoal/70">
            Tap an item above to see what goes with it.
          </p>
        )}
      </div>
    </main>
  );
}

function Picker({ items, selectedId }: { items: ClosetItem[]; selectedId: string | undefined }) {
  const groups = OUTFIT_SLOT_ORDER.map((c) => ({ category: c, list: items.filter((i) => i.category === c) })).filter((g) => g.list.length > 0);
  return (
    <section aria-label="Choose an item" className="space-y-4">
      {groups.map(({ category, list }) => (
        <div key={category}>
          <h2 className="label">{CATEGORY_META[category].plural}</h2>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {list.map((item) => {
              const active = item.id === selectedId;
              return (
                <Link
                  key={item.id}
                  href={`/closet/match?item=${item.id}`}
                  aria-current={active ? "true" : undefined}
                  className={`w-24 shrink-0 overflow-hidden rounded-2xl border bg-white ${active ? "border-obsidian ring-2 ring-obsidian" : "border-charcoal/15"}`}
                >
                  <ItemImage src={item.imageUrl} alt={item.subTypeName} fallbackLabel={CATEGORY_META[item.category].label} fallbackHex={familyHex(item.colorFamily)} />
                  <span className="block truncate px-2 py-1.5 text-[11px] text-obsidian">{item.subTypeName}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

async function Results({ userId, selected, items }: { userId: string; selected: ClosetItem; items: ClosetItem[] }) {
  const slot = LOOKBOOK_SLOT[selected.category];
  const family = toLookbookFamily(selected.colorFamily);

  const [usedIn, lookbook] = await Promise.all([
    listOutfitsUsingItem(userId, selected.id),
    slot
      ? filterByItem(userId, slot, family)
      : listCombosWithFamily(userId, family).then((combos): { combos: ComboSummary[]; outfits: OutfitView[] } => ({ combos, outfits: [] })),
  ]);

  const compatible = OUTFIT_SLOT_ORDER.filter((c) => c !== selected.category)
    .map((c) => ({
      category: c,
      list: items.filter((i) => i.category === c && familiesCompatible(selected.colorFamily, i.colorFamily)),
    }))
    .filter((g) => g.list.length > 0);

  const lookbookNote =
    selected.category === "belt"
      ? `Outfits whose shoes are ${familyLabel(selected.colorFamily).toLowerCase()} — a belt should match the shoes.`
      : slot
        ? `Outfits featuring ${CATEGORY_META[selected.category].label.toLowerCase()} pieces in ${familyLabel(selected.colorFamily).toLowerCase()}.`
        : `Palettes that include ${familyLabel(selected.colorFamily).toLowerCase()}.`;

  return (
    <div className="space-y-10" aria-live="polite">
      <section className="flex items-center gap-4 rounded-2xl bg-surface p-4">
        <div className="w-24 shrink-0 overflow-hidden rounded-xl">
          <ItemImage src={selected.imageUrl} alt={selected.subTypeName} fallbackLabel={CATEGORY_META[selected.category].label} fallbackHex={familyHex(selected.colorFamily)} priority />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-editorial text-bronze">{CATEGORY_META[selected.category].label}</p>
          <h2 className="text-2xl leading-snug">{selected.subTypeName}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-charcoal/70">
            <span className="h-3 w-3 rounded-full border border-bronze" style={{ backgroundColor: familyHex(selected.colorFamily) }} aria-hidden />
            {familyLabel(selected.colorFamily)}
          </p>
          <Link href={`/closet/outfits/new?category=${selected.category}&item=${selected.id}`} className="mt-2 inline-block text-xs underline underline-offset-2">
            Build an outfit with this →
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl">From your closet</h2>
        {compatible.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal/70">No compatible pieces yet. Add more items to see pairings.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {compatible.map(({ category, list }) => (
              <div key={category}>
                <h3 className="label">{CATEGORY_META[category].plural} that go with it</h3>
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {list.map((item) => (
                    <li key={item.id}><ClosetItemCard item={item} href={`/closet/match?item=${item.id}`} /></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl">Your saved outfits with it</h2>
        {usedIn.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal/70">None yet — build one with this piece.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {usedIn.map((o) => (
              <li key={o.id}><ClosetOutfitCard outfit={o} /></li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-2xl">Lookbook inspiration</h2>
        <p className="mt-1 text-sm text-charcoal/70">{lookbookNote}</p>
        {lookbook.combos.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-surface p-6 text-center text-sm text-charcoal/70">No lookbook matches yet.</p>
        ) : (
          <>
            <h3 className="mt-5 text-lg">Matching palettes</h3>
            <div className="no-scrollbar -mx-4 mt-3 flex gap-4 overflow-x-auto px-4 pb-2">
              {lookbook.combos.map((c) => (
                <div key={c.id} className="w-72 shrink-0"><ComboCard combo={c} compact /></div>
              ))}
            </div>
          </>
        )}
        {lookbook.outfits.length > 0 && (
          <>
            <h3 className="mt-6 text-lg">Matching outfits</h3>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              {lookbook.outfits.slice(0, 12).map((o) => (
                <OutfitCard key={o.id} outfit={o} showComboLink />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
