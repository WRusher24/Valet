import Link from "next/link";
import { OutfitBuilder } from "@/components/OutfitBuilder";
import { PageHero } from "@/components/PageHero";
import { isWardrobeCategory } from "@/lib/closet";
import { uuidSchema } from "@/lib/closet-schema";
import { listItems } from "@/lib/closet-queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Build Outfit" };

export default async function NewOutfitPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; item?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const items = await listItems(user.id);
  const id = uuidSchema.safeParse(sp.item);
  const preselect =
    isWardrobeCategory(sp.category) && id.success && items.some((i) => i.id === id.data && i.category === sp.category)
      ? { category: sp.category, id: id.data }
      : undefined;

  return (
    <main>
      <PageHero eyebrow="My Closet" title="Build an Outfit" />
      <div className="mx-auto max-w-xl px-4 pt-5">
        <Link href="/closet?view=outfits" className="mb-5 inline-block text-xs uppercase tracking-editorial text-bronze">← My outfits</Link>
        <OutfitBuilder
          items={items.map(({ id, imageUrl, category, subTypeName, colorFamily }) => ({ id, imageUrl, category, subTypeName, colorFamily }))}
          preselect={preselect}
        />
      </div>
    </main>
  );
}
