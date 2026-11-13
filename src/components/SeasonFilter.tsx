import Link from "next/link";
import { SEASON_FILTERS, type SeasonFilter as Filter } from "@/lib/constants";

export function SeasonFilter({ active }: { active: Filter }) {
  return (
    <nav aria-label="Season filter" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {SEASON_FILTERS.map((f) => (
        <Link
          key={f.value}
          href={f.value === "all" ? "/" : `/?season=${f.value}`}
          aria-current={active === f.value ? "page" : undefined}
          className={`pill ${active === f.value ? "pill-active" : ""}`}
        >
          {f.label}
        </Link>
      ))}
    </nav>
  );
}
