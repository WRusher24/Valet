import Link from "next/link";
import { ItemForm } from "@/components/ItemForm";
import { PageHero } from "@/components/PageHero";
import { isWardrobeCategory } from "@/lib/closet";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Add Item" };

export default async function NewItemPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireUser();
  const { category } = await searchParams;
  return (
    <main>
      <PageHero eyebrow="My Closet" title="Add an Item" />
      <div className="mx-auto max-w-xl px-4 pt-5">
        <Link href="/closet" className="mb-5 inline-block text-xs uppercase tracking-editorial text-bronze">← Back to closet</Link>
        <ItemForm mode="create" defaultCategory={isWardrobeCategory(category) ? category : undefined} />
      </div>
    </main>
  );
}
