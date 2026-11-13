import Link from "next/link";
import { deleteWearLogAction } from "@/app/actions/outfits";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { OutfitCard } from "@/components/OutfitCard";
import { OutfitImage } from "@/components/OutfitImage";
import { PageHero } from "@/components/PageHero";
import { Swatch } from "@/components/Swatch";
import { formatDate } from "@/lib/constants";
import { listFavorites, listWearHistory } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Log" };

export default async function LogPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const tab = (await searchParams).tab === "saved" ? "saved" : "history";
  const tabs = [
    { key: "history", label: "Worn History" },
    { key: "saved", label: "Saved" },
  ] as const;

  return (
    <main>
      <PageHero eyebrow="Your private vault" title="Wear History & Saved" />
      <div className="mx-auto max-w-3xl px-4 pt-5">
        <nav className="flex gap-2" aria-label="Log sections">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/log?tab=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={`pill ${tab === t.key ? "pill-active" : ""}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        {tab === "history" ? <History userId={user.id} /> : <Saved userId={user.id} />}
      </div>
    </main>
  );
}

async function History({ userId }: { userId: string }) {
  const entries = await listWearHistory(userId);
  if (entries.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-charcoal/25 bg-surface p-8 text-center text-charcoal/70">
        Nothing logged yet. Open any outfit and tap “Wore This Today”.
      </p>
    );
  }
  return (
    <ol className="mt-6 space-y-3">
      {entries.map(({ id, wornOn, outfit }) => (
        <li key={id} className="flex gap-4 rounded-2xl border border-charcoal/10 bg-surface p-3">
          <div className="w-24 shrink-0 overflow-hidden rounded-xl">
            <OutfitImage src={outfit.imageUrl} alt={outfit.title} colors={outfit.comboColors} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-editorial text-bronze">{formatDate(wornOn)}</p>
            <Link href={`/combos/${outfit.comboId}`} className="mt-1 block font-display text-lg leading-snug text-obsidian">
              {outfit.title}
            </Link>
            <div className="mt-2 flex gap-1.5">
              {outfit.comboColors.map((c, i) => (
                <Swatch key={`${c.hex}-${i}`} color={c} size="sm" showLabel={false} />
              ))}
            </div>
            <p className="mt-2 truncate text-xs text-charcoal/70">{outfit.comboTitle}</p>
            <form action={deleteWearLogAction} className="mt-2">
              <input type="hidden" name="logId" value={id} />
              <ConfirmSubmit message="Remove this entry from your history?">Remove</ConfirmSubmit>
            </form>
          </div>
        </li>
      ))}
    </ol>
  );
}

async function Saved({ userId }: { userId: string }) {
  const outfits = await listFavorites(userId);
  if (outfits.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-charcoal/25 bg-surface p-8 text-center text-charcoal/70">
        No saved outfits yet. Tap “Save” on any outfit to keep it here.
      </p>
    );
  }
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      {outfits.map((o) => (
        <OutfitCard key={o.id} outfit={o} showComboLink />
      ))}
    </div>
  );
}
