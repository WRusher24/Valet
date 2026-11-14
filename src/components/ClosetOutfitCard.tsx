import Link from "next/link";
import type { ClosetOutfitView } from "@/lib/closet-queries";
import { ClosetOutfitCollage } from "./ClosetOutfitCollage";
import { SeasonTag } from "./SeasonTag";

/** Compact, tappable summary used in lists. */
export function ClosetOutfitCard({ outfit }: { outfit: ClosetOutfitView }) {
  return (
    <Link
      href={`/closet/outfits/${outfit.id}`}
      className="block rounded-2xl border border-charcoal/10 bg-surface p-4 transition hover:border-bronze active:scale-[0.99]"
    >
      <ClosetOutfitCollage items={outfit.items} />
      <div className="mt-3 flex gap-2">
        {outfit.palette.map((c) => (
          <span key={c.hex} className="h-2.5 flex-1 rounded-full border border-bronze/60" style={{ backgroundColor: c.hex }} title={c.name} />
        ))}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-lg leading-snug">{outfit.name}</h3>
        <SeasonTag season={outfit.season} />
      </div>
    </Link>
  );
}
