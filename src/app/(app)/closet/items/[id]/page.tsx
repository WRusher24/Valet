import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteClosetItemAction } from "@/app/actions/closet";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ItemForm } from "@/components/ItemForm";
import { PageHero } from "@/components/PageHero";
import { CATEGORY_META, isRequiredCategory } from "@/lib/closet";
import { uuidSchema } from "@/lib/closet-schema";
import { getItem, listOutfitsUsingItem } from "@/lib/closet-queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Edit Item" };

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = uuidSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const item = await getItem(user.id, id.data);
  if (!item) notFound();
  const usedIn = await listOutfitsUsingItem(user.id, item.id);

  return (
    <main>
      <PageHero eyebrow={CATEGORY_META[item.category].label} title="Edit Item" />
      <div className="mx-auto max-w-xl px-4 pt-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/closet" className="text-xs uppercase tracking-editorial text-bronze">← Back to closet</Link>
          <div className="flex gap-2">
            <Link href={`/closet/match?item=${item.id}`} className="btn-outline !py-2">Find matches</Link>
            <Link href={`/closet/outfits/new?category=${item.category}&item=${item.id}`} className="btn-outline !py-2">Build outfit</Link>
          </div>
        </div>
        <ItemForm
          key={item.imageUrl}
          mode="edit"
          itemId={item.id}
          initial={{ imageUrl: item.imageUrl, category: item.category, subTypeName: item.subTypeName, colorFamily: item.colorFamily }}
        />
        <form action={deleteClosetItemAction} className="mt-10 border-t border-charcoal/15 pt-5">
          <input type="hidden" name="itemId" value={item.id} />
          <ConfirmSubmit
            message={
              usedIn.length === 0
                ? `Delete "${item.subTypeName}"? This can't be undone.`
                : isRequiredCategory(item.category)
                  ? `Delete "${item.subTypeName}"? ${usedIn.length} saved outfit${usedIn.length === 1 ? "" : "s"} using it will be deleted too. This can't be undone.`
                  : `Delete "${item.subTypeName}"? It will be removed from ${usedIn.length} saved outfit${usedIn.length === 1 ? "" : "s"}, which stay saved without it.`
            }
          >
            Delete this item
          </ConfirmSubmit>
          {usedIn.length > 0 && (
            <p className="mt-2 text-xs text-charcoal/60">Used in {usedIn.length} saved outfit{usedIn.length === 1 ? "" : "s"}.</p>
          )}
        </form>
      </div>
    </main>
  );
}
