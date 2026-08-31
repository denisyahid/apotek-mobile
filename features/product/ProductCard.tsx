"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { formatIDR, formatNumberID } from "@/lib/format";
import type { Product } from "@/types";

/**
 * Card obat grid 2 kolom (mobile) — sesuai spec:
 * [foto] / nama / kategori / harga / stok / tombol +
 */
export function ProductCard({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string;
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
      toast(
        "Obat keras: wajib resep dokter & verifikasi apoteker saat pengambilan",
        "warning"
      );
    }
    add(product, 1);
    toast(`${product.name} ditambahkan ke keranjang`, "success");
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5 transition-shadow hover:shadow-lg">
      <Link
        href={`/obat/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-slate-50"
        aria-label={`Lihat detail ${product.name}`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.requiresPrescription && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-1 text-[10px] font-bold text-white">
            <ReceiptText size={11} aria-hidden /> Resep
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-slate-800/85 px-3 py-1 text-xs font-bold text-white">
              Stok Habis
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`/obat/${product.id}`} className="min-h-[2.5rem]">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800">
            {product.name}
          </h3>
        </Link>
        {categoryName && <p className="mt-0.5 text-[11px] text-slate-400">{categoryName}</p>}

        <p className="mt-1.5 text-[15px] font-extrabold text-slate-900">
          {formatIDR(product.price)}
        </p>
        <p
          className={`mt-0.5 text-[11px] font-medium ${
            outOfStock ? "text-red-500" : "text-green-600"
          }`}
        >
          {outOfStock ? "Stok habis" : "Stok tersedia"}
        </p>

        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-[10px] text-slate-400">
            {formatNumberID(product.sold)} terjual
          </span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`Tambah ${product.name} ke keranjang`}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800 disabled:bg-slate-300"
          >
            <Plus size={18} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Varian card kecil untuk scroll horizontal (rekomendasi/terkait) */
export function ProductCardMini({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string;
}) {
  return (
    <div className="w-[10.5rem] shrink-0 snap-start-always">
      <ProductCard product={product} categoryName={categoryName} />
    </div>
  );
}
