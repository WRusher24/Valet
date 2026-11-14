import Link from "next/link";
import { CATEGORY_META } from "@/lib/closet";
import type { ClosetOutfitView } from "@/lib/closet-queries";
import { SeasonTag } from "./SeasonTag";
import { ItemImage } from "./ItemImage";

export function ClosetOutfitCard({ outfit }: { outfit: ClosetOutfitView }) {
  return (
    <Link
      href={`/closet/outfits/${outfit.id}`}
      className="block rounded-2xl border border-charcoal/10 bg-surface p-4 transition hover:border-bronze active:scale-[0.99]"
    >
      <div className="flex gap-2.5">
        {outfit.palette.map((c) => (
          <span key={c.hex} className="h-16 flex-1 rounded-full border border-bronze" style={{ backgroundColor: c.hex }} title={c.name} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {outfit.items.map((item) => (
          <ItemImage
            key={item.id}
            src={item.imageUrl}
            alt={item.subTypeName}
            fallbackLabel={CATEGORY_META[item.category].label}
            className="rounded-lg"
          />
        ))}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-lg leading-snug">{outfit.name}</h3>
        <SeasonTag season={outfit.season} />
      </div>
    </Link>
  );
}
