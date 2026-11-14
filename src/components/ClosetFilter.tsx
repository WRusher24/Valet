import Link from "next/link";
import {
  CLOSET_FILTERS,
  WARDROBE_FAMILIES,
  familyHex,
  familyLabel,
  familyShades,
  type ClosetFilter as Filter,
  type WardrobeFamily,
} from "@/lib/closet";

function href(category: Filter, family: WardrobeFamily | null): string {
  const q = new URLSearchParams();
  if (category !== "all") q.set("category", category);
  if (family) q.set("family", family);
  const qs = q.toString();
  return qs ? `/closet?${qs}` : "/closet";
}

interface Props {
  active: Filter;
  family: WardrobeFamily | null;
  counts: Record<string, number>;
  familyCounts: Record<string, number>;
}

/** Category pills (All … Bracelets) plus the 10 colour-family pills, combinable. */
export function ClosetFilter({ active, family, counts, familyCounts }: Props) {
  return (
    <div className="space-y-3">
      <nav aria-label="Closet category" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
        {CLOSET_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={href(f.value, family)}
            aria-current={active === f.value ? "page" : undefined}
            className={`pill ${active === f.value ? "pill-active" : ""}`}
          >
            {f.label}
            <span className={`text-[11px] ${active === f.value ? "text-white/70" : "text-charcoal/50"}`}>{counts[f.value] ?? 0}</span>
          </Link>
        ))}
      </nav>
      <nav aria-label="Colour family" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
        <Link href={href(active, null)} aria-current={family === null ? "page" : undefined} className={`pill ${family === null ? "pill-active" : ""}`}>
          Any colour
        </Link>
        {WARDROBE_FAMILIES.map((f) => (
          <Link key={f} href={href(active, f)} aria-current={family === f ? "page" : undefined} className={`pill ${family === f ? "pill-active" : ""}`}>
            <span className="h-4 w-4 shrink-0 rounded-full border border-bronze" style={{ backgroundColor: familyHex(f) }} aria-hidden />
            {familyLabel(f)}
            <span className={`text-[11px] ${family === f ? "text-white/70" : "text-charcoal/50"}`}>{familyCounts[f] ?? 0}</span>
          </Link>
        ))}
      </nav>
      {family && <p className="text-xs text-charcoal/60">Includes {familyShades(family)}.</p>}
    </div>
  );
}
