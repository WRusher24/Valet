import Link from "next/link";
import { ClosetFilter } from "@/components/ClosetFilter";
import { ClosetItemCard } from "@/components/ClosetItemCard";
import { ClosetOutfitCard } from "@/components/ClosetOutfitCard";
import { PageHero } from "@/components/PageHero";
import { parseClosetFilter } from "@/lib/closet";
import { countItemsByCategory, listClosetOutfits, listItems } from "@/lib/closet-queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "My Closet" };

export default async function ClosetPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; view?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const view = sp.view === "outfits" ? "outfits" : "items";
  const filter = parseClosetFilter(sp.category);

  return (
    <main>
      <PageHero eyebrow="Your real wardrobe" title="My Closet">
        <div className="flex flex-wrap gap-2">
          <Link href={`/closet/items/new${filter !== "all" ? `?category=${filter}` : ""}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-obsidian">
            + Add Item
          </Link>
          <Link href="/closet/outfits/new" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-medium text-white">
            Build Outfit
          </Link>
          <Link href="/closet/match" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-medium text-white">
            Find Matches
          </Link>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        <nav className="mb-4 flex gap-2" aria-label="Closet sections">
          <Link href="/closet" aria-current={view === "items" ? "page" : undefined} className={`pill ${view === "items" ? "pill-active" : ""}`}>Items</Link>
          <Link href="/closet?view=outfits" aria-current={view === "outfits" ? "page" : undefined} className={`pill ${view === "outfits" ? "pill-active" : ""}`}>My Outfits</Link>
        </nav>
        {view === "items" ? <Items userId={user.id} filter={filter} /> : <Outfits userId={user.id} />}
      </div>
    </main>
  );
}

async function Items({ userId, filter }: { userId: string; filter: ReturnType<typeof parseClosetFilter> }) {
  const [items, counts] = await Promise.all([listItems(userId, filter), countItemsByCategory(userId)]);
  return (
    <>
      <ClosetFilter active={filter} counts={counts} />
      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-charcoal/25 bg-surface p-10 text-center">
          <p className="font-display text-xl text-obsidian">{counts.all === 0 ? "Your closet is empty" : "Nothing in this category yet"}</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-charcoal/70">
            Photograph your tops, bottoms, shoes, belts, watches and bracelets to build outfits from what you actually own.
          </p>
          <Link href={`/closet/items/new${filter !== "all" ? `?category=${filter}` : ""}`} className="btn-primary mt-5">+ Add your first item</Link>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <ClosetItemCard item={item} href={`/closet/items/${item.id}`} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

async function Outfits({ userId }: { userId: string }) {
  const outfits = await listClosetOutfits(userId);
  if (outfits.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-charcoal/25 bg-surface p-10 text-center">
        <p className="font-display text-xl text-obsidian">No outfits yet</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-charcoal/70">Combine a top, bottom, shoes, belt, watch and bracelet from your closet.</p>
        <Link href="/closet/outfits/new" className="btn-primary mt-5">Build an outfit</Link>
      </div>
    );
  }
  return (
    <ul className="mt-5 grid gap-4 sm:grid-cols-2">
      {outfits.map((o) => (
        <li key={o.id}><ClosetOutfitCard outfit={o} /></li>
      ))}
    </ul>
  );
}
