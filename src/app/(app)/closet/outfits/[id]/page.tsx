import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteClosetOutfitAction } from "@/app/actions/closet";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ItemImage } from "@/components/ItemImage";
import { SeasonTag } from "@/components/SeasonTag";
import { WearButton } from "@/components/WearButton";
import { Swatch } from "@/components/Swatch";
import { CATEGORY_META, familyHex, familyLabel } from "@/lib/closet";
import { uuidSchema } from "@/lib/closet-schema";
import { getClosetOutfit } from "@/lib/closet-queries";
import { formatDate } from "@/lib/constants";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Closet Outfit" };

export default async function ClosetOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = uuidSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const outfit = await getClosetOutfit(user.id, id.data);
  if (!outfit) notFound();

  return (
    <main>
      <section className="bg-obsidian px-5 pb-9 pt-6 text-white">
        <div className="mx-auto max-w-3xl">
          <Link href={outfit.comboId ? `/combos/${outfit.comboId}` : "/closet?view=outfits"} className="text-xs uppercase tracking-editorial text-bronze">{outfit.comboId ? "← Colour combination" : "← My outfits"}</Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SeasonTag season={outfit.season} />
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-obsidian">{outfit.items.length} pieces</span>
          </div>
          <h1 className="mt-3 text-3xl leading-tight !text-white sm:text-4xl">{outfit.name}</h1>
          <div className="mt-6 flex items-stretch gap-3 rounded-2xl bg-white p-4">
            {outfit.palette.map((c) => (
              <Swatch key={c.hex} color={c} size="hero" />
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h2 className="mb-4 text-2xl">The Pieces</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {outfit.items.map((item) => (
            <li key={item.id}>
              <Link href={`/closet/items/${item.id}`} className="block overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
                <ItemImage src={item.imageUrl} alt={item.subTypeName} fallbackLabel={CATEGORY_META[item.category].label} fallbackHex={familyHex(item.colorFamily)} priority />
                <div className="space-y-1 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-editorial text-bronze">{CATEGORY_META[item.category].label}</p>
                  <p className="text-sm font-medium leading-snug text-obsidian">{item.subTypeName}</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-charcoal/70">
                    <span className="h-3 w-3 rounded-full border border-bronze" style={{ backgroundColor: familyHex(item.colorFamily) }} aria-hidden />
                    {familyLabel(item.colorFamily)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {outfit.notes && <p className="mt-6 rounded-2xl bg-surface p-4 text-sm text-charcoal/80">{outfit.notes}</p>}
        {outfit.comboId && (
          <Link href={`/combos/${outfit.comboId}`} className="mt-4 inline-block text-xs underline underline-offset-2">
            View this colour combination →
          </Link>
        )}
        {outfit.lastWorn && <p className="mt-4 text-xs text-charcoal/70">Last worn {formatDate(outfit.lastWorn)}</p>}
        <div className="mt-4"><WearButton outfitId={outfit.id} kind="closet" /></div>

        <form action={deleteClosetOutfitAction} className="mt-10 border-t border-charcoal/15 pt-5">
          <input type="hidden" name="outfitId" value={outfit.id} />
          <input type="hidden" name="returnTo" value={outfit.comboId ? `/combos/${outfit.comboId}` : "/closet?view=outfits"} />
          <ConfirmSubmit message="Delete this outfit? Your closet items are not affected.">Delete this outfit</ConfirmSubmit>
        </form>
      </div>
    </main>
  );
}
