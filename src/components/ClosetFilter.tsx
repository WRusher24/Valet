import Link from "next/link";
import { CLOSET_FILTERS, type ClosetFilter as Filter } from "@/lib/closet";

export function ClosetFilter({ active, counts }: { active: Filter; counts: Record<string, number> }) {
  return (
    <nav aria-label="Closet category" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {CLOSET_FILTERS.map((f) => (
        <Link
          key={f.value}
          href={f.value === "all" ? "/closet" : `/closet?category=${f.value}`}
          aria-current={active === f.value ? "page" : undefined}
          className={`pill ${active === f.value ? "pill-active" : ""}`}
        >
          {f.label}
          <span className={`text-[11px] ${active === f.value ? "text-white/70" : "text-charcoal/50"}`}>{counts[f.value] ?? 0}</span>
        </Link>
      ))}
    </nav>
  );
}
