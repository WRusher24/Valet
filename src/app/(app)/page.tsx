import { shuffleAction } from "@/app/actions/combos";
import { ComboCard } from "@/components/ComboCard";
import { PageHero } from "@/components/PageHero";
import { SeasonFilter } from "@/components/SeasonFilter";
import { ShuffleIcon } from "@/components/icons";
import { parseSeasonFilter } from "@/lib/constants";
import { listCombos } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Explore" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const user = await requireUser();
  const filter = parseSeasonFilter((await searchParams).season);
  const combos = await listCombos(user.id, filter);

  return (
    <main>
      <PageHero eyebrow="The Colour Lookbook" title="Explore Color Combos">
        <form action={shuffleAction}>
          <input type="hidden" name="season" value={filter} />
          <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-obsidian active:scale-[0.98]">
            <ShuffleIcon /> Shuffle Combo
          </button>
        </form>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        <SeasonFilter active={filter} />
        <p className="mt-4 text-xs uppercase tracking-editorial text-charcoal/60">
          {combos.length} {combos.length === 1 ? "combination" : "combinations"}
        </p>
        {combos.length === 0 ? (
          <p className="py-16 text-center text-charcoal/70">No combinations match this filter yet.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {combos.map((combo) => (
              <li key={combo.id}>
                <ComboCard combo={combo} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
