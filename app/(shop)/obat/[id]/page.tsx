import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/features/product/ProductDetail";
import { ProductCard } from "@/features/product/ProductCard";
import { SectionHeader } from "@/components/ui/Misc";
import { jsonRepositories } from "@/repositories";

interface Params {
  params: { id: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await jsonRepositories.products.getById(params.id);
  if (!product) return { title: "Obat tidak ditemukan" };
  return {
    title: product.name,
    description: `${product.name} — ${product.description.slice(0, 140)}`,
    openGraph: {
      title: `${product.name} · Apotek Sehatku`,
      description: product.description,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductDetailPage({ params }: Params) {
  const product = await jsonRepositories.products.getById(params.id);
  if (!product || !product.isActive) notFound();

  const category = await jsonRepositories.categories.getById(product.categoryId);
  const related = await jsonRepositories.products.getAll({
    categoryId: product.categoryId,
    limit: 6,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <ProductDetail product={product} categoryName={category?.name} />

      {related.filter((p) => p.id !== product.id).length > 0 && (
        <section aria-label="Produk terkait" className="px-4 pb-6 pt-2">
          <SectionHeader title={`Produk ${category?.name ?? "Terkait"} Lainnya`} />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x-mandatory">
            {related
              .filter((p) => p.id !== product.id)
              .map((p) => (
                <div key={p.id} className="w-[10.5rem] shrink-0 snap-start-always">
                  <ProductCard product={p} categoryName={category?.name} />
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
