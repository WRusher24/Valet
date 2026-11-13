import { shuffleAction } from "@/app/actions/combos";
import { PageHero } from "@/components/PageHero";
import { ShuffleIcon } from "@/components/icons";
import { SEASON_FILTERS } from "@/lib/constants";

export const metadata = { title: "Shuffle" };

export default function ShufflePage() {
  return (
    <main>
      <PageHero eyebrow="Instant inspiration" title="Skip the Decision" />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <form action={shuffleAction} className="rounded-3xl border border-charcoal/10 bg-surface p-6 text-center">
          <p className="mx-auto max-w-sm text-sm text-charcoal/80">
            We&apos;ll pick a colour combination at random and open its full outfit gallery.
          </p>
          <fieldset className="mt-6">
            <legend className="label text-center">Weather</legend>
            <div className="mt-2 flex flex-col gap-2">
              {SEASON_FILTERS.map((f, i) => (
                <label key={f.value} className="cursor-pointer">
                  <input type="radio" name="season" value={f.value} defaultChecked={i === 0} className="peer sr-only" />
                  <span className="pill w-full justify-center peer-checked:border-obsidian peer-checked:bg-obsidian peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-bronze">
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="btn-primary mt-8 w-full !py-4 text-base">
            <ShuffleIcon /> Shuffle Combo
          </button>
        </form>
      </div>
    </main>
  );
}
