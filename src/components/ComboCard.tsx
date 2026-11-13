import Link from "next/link";
import type { ComboSummary } from "@/lib/queries";
import { SeasonTag } from "./SeasonTag";
import { Swatch } from "./Swatch";

export function ComboCard({ combo }: { combo: ComboSummary }) {
  return (
    <Link
      href={`/combos/${combo.id}`}
      className="group flex h-full flex-col rounded-2xl border border-charcoal/10 bg-surface p-5 transition hover:border-bronze active:scale-[0.99]"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SeasonTag season={combo.season} />
          {combo.isOwn && <span className="tag border-obsidian text-obsidian">Yours</span>}
        </div>
        <span className="rounded-full bg-obsidian px-3 py-1 text-[11px] font-medium text-white">
          {combo.outfitCount} {combo.outfitCount === 1 ? "Outfit" : "Outfits"}
        </span>
      </div>
      <div className="flex items-start justify-center gap-4 py-2">
        {combo.colors.map((color, i) => (
          <Swatch key={`${color.hex}-${i}`} color={color} />
        ))}
      </div>
      <h3 className="mt-5 text-xl leading-snug">{combo.title}</h3>
      <p className="mt-auto pt-3 text-xs uppercase tracking-editorial text-bronze group-hover:underline">
        View outfits →
      </p>
    </Link>
  );
}
