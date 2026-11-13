import type { OutfitView } from "@/lib/queries";
import { deleteOutfitAction } from "@/app/actions/outfits";
import { FAMILY_META, SLOT_META, formatDate, type ColorFamily, type GarmentSlot } from "@/lib/constants";
import { ConfirmSubmit } from "./ConfirmSubmit";
import { FavoriteButton } from "./FavoriteButton";
import { OutfitImage } from "./OutfitImage";
import { SeasonTag } from "./SeasonTag";
import { ReplacePhoto } from "./ReplacePhoto";
import { WearButton } from "./WearButton";
import Link from "next/link";

interface OutfitCardProps {
  outfit: OutfitView;
  highlight?: { slot: GarmentSlot; family: ColorFamily };
  showComboLink?: boolean;
  priority?: boolean;
}

export function OutfitCard({ outfit, highlight, showComboLink = false, priority = false }: OutfitCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
      <OutfitImage src={outfit.imageUrl} alt={outfit.title} colors={outfit.comboColors} priority={priority} />
      <div className="space-y-4 p-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-editorial text-bronze">{outfit.style}</p>
            <h3 className="mt-1 text-xl leading-snug">{outfit.title}</h3>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <SeasonTag season={outfit.season} />
            {outfit.isOwn && <span className="tag border-obsidian text-obsidian">Yours</span>}
          </div>
        </header>

        {showComboLink && (
          <Link href={`/combos/${outfit.comboId}`} className="block text-xs text-charcoal/70 underline-offset-2 hover:underline">
            Palette: {outfit.comboTitle}
          </Link>
        )}

        <ul className="hairline divide-y divide-charcoal/10 text-sm">
          {outfit.items.map((item, i) => {
            const match = highlight?.slot === item.slot && highlight.family === item.family;
            return (
              <li key={`${item.slot}-${i}`} className="flex items-baseline gap-3 py-2">
                <span className="w-16 shrink-0 text-[11px] font-medium uppercase tracking-wide text-bronze">
                  {SLOT_META[item.slot].short}
                </span>
                <span className={match ? "font-semibold text-obsidian" : ""}>
                  {item.description}
                  <span className="ml-2 text-[11px] text-charcoal/50">{FAMILY_META[item.family].label}</span>
                </span>
              </li>
            );
          })}
        </ul>

        {outfit.lastWorn && (
          <p className="text-xs text-charcoal/70">Last worn {formatDate(outfit.lastWorn)}</p>
        )}

        <div className="flex flex-wrap items-start gap-2">
          <FavoriteButton outfitId={outfit.id} initial={outfit.favorited} />
          <WearButton outfitId={outfit.id} />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-charcoal/10 pt-3">
          <ReplacePhoto outfitId={outfit.id} isOwn={outfit.isOwn} />
          <form action={deleteOutfitAction}>
            <input type="hidden" name="outfitId" value={outfit.id} />
            <ConfirmSubmit
              message={
                outfit.isOwn
                  ? "Delete this outfit and its photo? This can't be undone."
                  : "Remove this starter outfit from your lookbook?"
              }
            >
              Delete photo
            </ConfirmSubmit>
          </form>
        </div>
      </div>
    </article>
  );
}
