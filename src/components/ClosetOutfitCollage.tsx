import { CATEGORY_META, familyHex } from "@/lib/closet";
import type { ClosetItem } from "@/lib/closet-queries";
import { ItemImage } from "./ItemImage";

const ACCESSORIES = new Set(["belt", "watch", "bracelet"]);

function Tile({ item, priority }: { item: ClosetItem; priority: boolean }) {
  return (
    <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl">
      <ItemImage
        src={item.imageUrl}
        alt={`${CATEGORY_META[item.category].label}: ${item.subTypeName}`}
        fallbackLabel={CATEGORY_META[item.category].label}
        fallbackHex={familyHex(item.colorFamily)}
        priority={priority}
      />
      <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-obsidian/70 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
        {CATEGORY_META[item.category].label}
      </span>
    </div>
  );
}

/**
 * Balanced two-row collage: garments (outerwear, top, bottom, shoes) on the first row and
 * accessories (belt, watch, bracelet) below, each row split into equal square tiles.
 */
export function ClosetOutfitCollage({ items, priority = false }: { items: ClosetItem[]; priority?: boolean }) {
  const garments = items.filter((i) => !ACCESSORIES.has(i.category));
  const accessories = items.filter((i) => ACCESSORIES.has(i.category));
  return (
    <div className="space-y-1.5" role="group" aria-label="Outfit pieces">
      {garments.length > 0 && (
        <div className="flex gap-1.5">
          {garments.map((item) => (
            <Tile key={item.id} item={item} priority={priority} />
          ))}
        </div>
      )}
      {accessories.length > 0 && (
        <div className="flex gap-1.5">
          {accessories.map((item) => (
            <Tile key={item.id} item={item} priority={priority} />
          ))}
        </div>
      )}
    </div>
  );
}
