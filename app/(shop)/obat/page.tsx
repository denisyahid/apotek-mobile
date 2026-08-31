import type { Metadata } from "next";
import { Suspense } from "react";
import { MedicineBrowser } from "@/features/product/MedicineBrowser";
import { ProductGridSkeleton } from "@/components/ui/StateViews";

export const metadata: Metadata = {
  title: "Cari Obat & Vitamin",
  description:
    "Telusuri ribuan obat, vitamin, dan suplemen. Filter berdasarkan kategori, harga, dan ketersediaan stok.",
  openGraph: { title: "Cari Obat & Vitamin · Apotek Sehatku" },
};

export default function MedicinesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-4">
          <ProductGridSkeleton count={8} />
        </div>
      }
    >
      <MedicineBrowser />
    </Suspense>
  );
}
