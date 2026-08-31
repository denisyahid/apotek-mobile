"use client";

import Image from "next/image";
import Link from "next/link";
import { ReceiptText, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { formatIDR } from "@/lib/format";
import type { RecommendedProduct } from "@/types";

/**
 * Bubble rekomendasi obat dari apoteker.
 * Pasien bisa lihat produk & tambah ke keranjang TANPA keluar dari chat.
 */
export function ProductBubble({
  product,
  viewerRole,
}: {
  product: RecommendedProduct;
  viewerRole: "patient" | "admin";
}) {
  const { add } = useCart();
  const { toast } = useToast();
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (outOfStock) {
      toast("Stok obat ini sedang habis", "warning");
      return;
    }
    if (product.requiresPrescription) {
      toast("Obat keras: wajib resep dokter & verifikasi apoteker", "warning");
    }
    add(
      {
        id: product.productId,
        name: product.name,
        categoryId: product.categoryId ?? "",
        price: product.price,
        stock: product.stock,
        image: product.image,
        description: "",
        rating: 0,
        sold: 0,
        isActive: true,
        createdAt: "",
        requiresPrescription: product.requiresPrescription,
      },
      1
    );
    toast(`${product.name} ditambahkan ke keranjang`, "success");
  };

  return (
    <div className="w-[15.5rem] max-w-full overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-900/10">
      <div className="border-b border-slate-100 bg-primary-50/70 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-primary-700">
          <ReceiptText size={12} aria-hidden /> Rekomendasi Apoteker
        </p>
      </div>

      <Link href={`/obat/${product.productId}`} className="flex gap-3 p-3">
        <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">
          <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-[13px] font-semibold leading-snug text-slate-800">
            {product.name}
          </span>
          <span className="mt-1 block text-sm font-extrabold text-slate-900">
            {formatIDR(product.price)}
          </span>
          <span
            className={`mt-0.5 block text-[11px] font-medium ${
              outOfStock ? "text-red-500" : "text-green-600"
            }`}
          >
            {outOfStock ? "Stok habis" : "Stok tersedia"}
          </span>
        </span>
      </Link>

      {product.requiresPrescription && (
        <p className="mx-3 mb-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold leading-relaxed text-amber-700 ring-1 ring-inset ring-amber-600/20">
          ⚠️ Obat keras — wajib resep dokter & verifikasi apoteker. Bukan diagnosis dokter.
        </p>
      )}

      {viewerRole === "patient" && (
        <div className="grid grid-cols-2 gap-2 p-3 pt-0">
          <Link
            href={`/obat/${product.productId}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Lihat Produk
          </Link>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-primary-600 text-xs font-bold text-white hover:bg-primary-700 disabled:bg-slate-300"
            disabled={outOfStock}
          >
            <ShoppingBag size={14} aria-hidden /> Keranjang
          </button>
        </div>
      )}
    </div>
  );
}
