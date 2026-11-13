import Link from "next/link";
import { ComboBuilder } from "@/components/ComboBuilder";
import { OutfitUploader } from "@/components/OutfitUploader";
import { PageHero } from "@/components/PageHero";
import { listAllComboOptions, countHiddenStarter } from "@/lib/queries";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { hideAllStarterPhotosAction, restoreStarterLibraryAction } from "@/app/actions/outfits";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Add" };

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; combo?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const tab = sp.tab === "photo" ? "photo" : "combo";
  const [options, hidden] = await Promise.all([
    tab === "photo" ? listAllComboOptions(user.id) : Promise.resolve([]),
    countHiddenStarter(user.id),
  ]);

  return (
    <main>
      <PageHero eyebrow="Make it yours" title={tab === "combo" ? "New Color Combo" : "Upload an Outfit"} />
      <div className="mx-auto max-w-xl px-4 pt-5">
        <nav className="mb-6 flex gap-2" aria-label="Add sections">
          <Link href="/add?tab=combo" aria-current={tab === "combo" ? "page" : undefined} className={`pill ${tab === "combo" ? "pill-active" : ""}`}>
            Custom Combo
          </Link>
          <Link href="/add?tab=photo" aria-current={tab === "photo" ? "page" : undefined} className={`pill ${tab === "photo" ? "pill-active" : ""}`}>
            Outfit Photo
          </Link>
        </nav>
        {tab === "combo" ? <ComboBuilder /> : <OutfitUploader combos={options} defaultComboId={sp.combo} />}
        <p className="mt-6 text-center text-xs text-charcoal/60">Everything you add is private to your account.</p>

        <section className="mt-10 rounded-2xl border border-charcoal/15 bg-surface p-5">
          <h2 className="text-xl">Starter library</h2>
          <p className="mt-1 text-sm text-charcoal/70">
            Don&apos;t like the starter photos? Clear them all and build your lookbook from your own uploads. This only
            affects your account, and your own photos are never touched.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <form action={hideAllStarterPhotosAction}>
              <ConfirmSubmit message="Remove ALL starter photos from your lookbook? You can restore them later.">
                Delete all starter photos
              </ConfirmSubmit>
            </form>
            {(hidden.outfits > 0 || hidden.combos > 0) && (
              <form action={restoreStarterLibraryAction}>
                <button type="submit" className="text-xs text-charcoal/70 underline underline-offset-2 hover:text-obsidian">
                  Restore removed starter items ({hidden.outfits} photos, {hidden.combos} combos)
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
