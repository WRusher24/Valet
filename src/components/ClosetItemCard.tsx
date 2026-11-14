import Link from "next/link";
import { CATEGORY_META, familyHex, familyLabel } from "@/lib/closet";
import type { ClosetItem } from "@/lib/closet-queries";
import { ItemImage } from "./ItemImage";

export function ClosetItemCard({ item, href }: { item: ClosetItem; href: string }) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-charcoal/10 bg-white transition hover:border-bronze active:scale-[0.99]"
    >
      <ItemImage
        src={item.imageUrl}
        alt={item.subTypeName}
        fallbackLabel={CATEGORY_META[item.category].label}
        fallbackHex={familyHex(item.colorFamily)}
      />
      <div className="space-y-1 p-2 sm:space-y-1.5 sm:p-3">
        <p className="truncate text-[9px] font-medium uppercase tracking-wide text-bronze sm:text-[10px] sm:tracking-editorial">{CATEGORY_META[item.category].label}</p>
        <p className="line-clamp-2 text-xs font-medium leading-snug text-obsidian sm:text-sm">{item.subTypeName}</p>
        <p className="flex items-center gap-1 text-[10px] text-charcoal/70 sm:gap-1.5 sm:text-[11px]">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full sm:h-3 sm:w-3 border border-bronze" style={{ backgroundColor: familyHex(item.colorFamily) }} aria-hidden />
          <span className="truncate">{familyLabel(item.colorFamily)}</span>
        </p>
      </div>
    </Link>
  );
}
