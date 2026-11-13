import Link from "next/link";
import { deleteComboAction } from "@/app/actions/combos";
import type { ComboSummary } from "@/lib/queries";
import { ConfirmSubmit } from "./ConfirmSubmit";
import { SeasonTag } from "./SeasonTag";
import { Swatch } from "./Swatch";

export function ComboCard({ combo, compact = false }: { combo: ComboSummary; compact?: boolean }) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-charcoal/10 bg-surface p-4 transition hover:border-bronze">
      {/* Palette is the hero of the card */}
      <div className="flex items-stretch gap-2.5 rounded-xl bg-white p-3">
        {combo.colors.map((color, i) => (
          <Swatch key={`${color.hex}-${i}`} color={color} size="fill" />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SeasonTag season={combo.season} />
          {combo.isOwn && <span className="tag border-obsidian text-obsidian">Yours</span>}
        </div>
        <span className="rounded-full bg-obsidian px-3 py-1 text-[11px] font-medium text-white">
          {combo.outfitCount} {combo.outfitCount === 1 ? "Outfit" : "Outfits"}
        </span>
      </div>

      <h3 className="mt-3 text-xl leading-snug">
        <Link href={`/combos/${combo.id}`} className="after:absolute after:inset-0 after:content-['']">
          {combo.title}
        </Link>
      </h3>

      {!compact && (
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs uppercase tracking-editorial text-bronze group-hover:underline">View outfits →</span>
          <form action={deleteComboAction} className="relative z-10">
            <input type="hidden" name="comboId" value={combo.id} />
            <ConfirmSubmit message={`Delete "${combo.title}"?${combo.isOwn ? " Its uploaded photos will be deleted too." : " It will be removed from your lookbook."}`} />
          </form>
        </div>
      )}
    </div>
  );
}
