import Link from "next/link";
import { ComboBuilder } from "@/components/ComboBuilder";
import { OutfitUploader } from "@/components/OutfitUploader";
import { PageHero } from "@/components/PageHero";
import { listAllComboOptions } from "@/lib/queries";
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
  const options = tab === "photo" ? await listAllComboOptions(user.id) : [];

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
      </div>
    </main>
  );
}
