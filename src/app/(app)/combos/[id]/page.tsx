import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteComboAction } from "@/app/actions/combos";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { OutfitCard } from "@/components/OutfitCard";
import { SeasonTag } from "@/components/SeasonTag";
import { Swatch } from "@/components/Swatch";
import { formatDate } from "@/lib/constants";
import { getCombo, lastWornForCombo, listOutfitsForCombo } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Combination" };

export default async function ComboPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const combo = await getCombo(user.id, id);
  if (!combo) notFound();

  const [outfits, lastWorn] = await Promise.all([
    listOutfitsForCombo(user.id, combo.id),
    lastWornForCombo(user.id, combo.id),
  ]);

  return (
    <main>
      <section className="bg-obsidian px-5 pb-9 pt-6 text-white">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-xs uppercase tracking-editorial text-bronze">
            ← All combinations
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SeasonTag season={combo.season} />
            {combo.isOwn && <span className="tag !border-white !text-white">Yours</span>}
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-obsidian">
              {combo.outfitCount} {combo.outfitCount === 1 ? "Outfit" : "Outfits"}
            </span>
          </div>
          <h1 className="mt-3 text-3xl leading-tight !text-white sm:text-4xl">{combo.title}</h1>
          {combo.description && <p className="mt-2 max-w-xl text-sm text-white/70">{combo.description}</p>}
          <div className="mt-6 flex flex-wrap items-start gap-5 rounded-2xl bg-white px-5 py-5">
            {combo.colors.map((c, i) => (
              <Swatch key={`${c.hex}-${i}`} color={c} size="lg" />
            ))}
          </div>
          {lastWorn && <p className="mt-4 text-xs text-white/70">Last worn in this palette: {formatDate(lastWorn)}</p>}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Outfit Inspiration</h2>
          <Link href={`/add?tab=photo&combo=${combo.id}`} className="btn-outline">
            + Upload your own photo
          </Link>
        </div>
        {outfits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-charcoal/25 bg-surface p-8 text-center text-charcoal/70">
            No outfits here yet. Upload your first photo in this palette.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {outfits.map((outfit, i) => (
              <OutfitCard key={outfit.id} outfit={outfit} priority={i < 2} />
            ))}
          </div>
        )}

        {combo.isOwn && (
          <form action={deleteComboAction} className="mt-10 border-t border-charcoal/15 pt-5">
            <input type="hidden" name="comboId" value={combo.id} />
            <ConfirmSubmit message="Delete this combination and all of its uploaded photos? This can't be undone.">
              Delete this combination
            </ConfirmSubmit>
          </form>
        )}
      </div>
    </main>
  );
}
