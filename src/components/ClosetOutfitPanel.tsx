import { deleteClosetOutfitAction } from "@/app/actions/closet";
import { CATEGORY_META } from "@/lib/closet";
import { formatDate } from "@/lib/constants";
import type { ClosetOutfitView } from "@/lib/closet-queries";
import { ClosetOutfitCollage } from "./ClosetOutfitCollage";
import { ConfirmSubmit } from "./ConfirmSubmit";
import { SeasonTag } from "./SeasonTag";
import { WearButton } from "./WearButton";

/** Full saved-outfit card: collage, details, "Wore This Today" and delete. */
export function ClosetOutfitPanel({ outfit, returnTo }: { outfit: ClosetOutfitView; returnTo: string }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
      <div className="bg-surface p-3">
        <ClosetOutfitCollage items={outfit.items} />
      </div>
      <div className="space-y-4 p-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-editorial text-bronze">From my closet</p>
            <h3 className="mt-1 text-xl leading-snug">{outfit.name}</h3>
          </div>
          <SeasonTag season={outfit.season} />
        </header>
        {outfit.notes && <p className="text-sm text-charcoal/80">{outfit.notes}</p>}
        <ul className="hairline divide-y divide-charcoal/10 text-sm">
          {outfit.items.map((item) => (
            <li key={item.id} className="flex items-baseline gap-3 py-2">
              <span className="w-20 shrink-0 text-[11px] font-medium uppercase tracking-wide text-bronze">{CATEGORY_META[item.category].label}</span>
              <span>{item.subTypeName}</span>
            </li>
          ))}
        </ul>
        {outfit.lastWorn && <p className="text-xs text-charcoal/70">Last worn {formatDate(outfit.lastWorn)}</p>}
        <div className="flex flex-wrap items-start gap-2">
          <WearButton outfitId={outfit.id} kind="closet" />
        </div>
        <form action={deleteClosetOutfitAction} className="border-t border-charcoal/10 pt-3">
          <input type="hidden" name="outfitId" value={outfit.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <ConfirmSubmit message="Delete this outfit? Your closet items are not affected.">Delete outfit</ConfirmSubmit>
        </form>
      </div>
    </article>
  );
}
