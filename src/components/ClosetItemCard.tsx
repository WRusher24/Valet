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
      <div className="space-y-1.5 p-3">
        <p className="text-[10px] font-medium uppercase tracking-editorial text-bronze">{CATEGORY_META[item.category].label}</p>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-obsidian">{item.subTypeName}</p>
        <p className="flex items-center gap-1.5 text-[11px] text-charcoal/70">
          <span className="h-3 w-3 rounded-full border border-bronze" style={{ backgroundColor: familyHex(item.colorFamily) }} aria-hidden />
          {familyLabel(item.colorFamily)}
        </p>
      </div>
    </Link>
  );
}
