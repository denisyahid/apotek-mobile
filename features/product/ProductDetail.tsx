"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  ReceiptText,
  ShieldAlert,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { RatingStars } from "@/components/ui/Misc";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { formatIDR, formatNumberID } from "@/lib/format";
import type { Product } from "@/types";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Accordion({ title, children, defaultOpen = true }: SectionProps) {
  return (
    <details open={defaultOpen} className="group rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-bold text-slate-800">{title}</span>
        <ChevronRight
          size={18}
          aria-hidden
          className="text-slate-400 transition-transform group-open:rotate-90"
        />
      </summary>
      <div className="px-4 pb-4 text-sm leading-relaxed text-slate-600">{children}</div>
    </details>
  );
}

/** Detail obat + sticky action bar (mobile: selalu mudah dijangkau) */
export function ProductDetail({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string;
}) {
  const router = useRouter();
  const { add } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const outOfStock = product.stock <= 0;

  const handleAdd = (thenGoToCart = false) => {
    if (outOfStock) {
      toast("Stok obat ini sedang habis", "warning");
      return;
    }
    add(product, qty);
    toast(`${product.name} (${qty}) ditambahkan ke keranjang`, "success");
    if (thenGoToCart) router.push("/keranjang");
  };

  return (
    <div className="pb-32">
      {/* Back */}
      <div className="px-4 pt-3">
        <Link
          href="/obat"
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-800"
        >
          <ChevronLeft size={18} aria-hidden /> Kembali ke Katalog
        </Link>
      </div>

      <div className="grid gap-6 px-4 pt-3 md:grid-cols-2 md:gap-8">
        {/* Foto */}
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-900/5">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          {product.isNew && (
            <span className="absolute left-3 top-3 rounded-full bg-primary-600 px-3 py-1 text-[11px] font-bold text-white">
              BARU
            </span>
          )}
        </div>

        {/* Info utama */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <Link href={`/obat?kategori=${categoryName.toLowerCase().replace(/ /g, "-")}`}>
                <Badge tone="teal">{categoryName}</Badge>
              </Link>
            )}
            {product.brand && <Badge tone="slate">{product.brand}</Badge>}
            {product.requiresPrescription && (
              <Badge tone="amber">
                <ReceiptText size={12} aria-hidden /> Wajib Resep Dokter
              </Badge>
            )}
          </div>

          <h1 className="mt-2.5 text-xl font-extrabold leading-snug text-slate-900">
            {product.name}
          </h1>
          {product.unit && <p className="mt-1 text-sm text-slate-500">Kemasan: {product.unit}</p>}

          <RatingStars rating={product.rating} sold={product.sold} className="mt-2" />

          <div className="mt-3 flex items-end gap-2">
            <p className="text-2xl font-extrabold text-slate-900">{formatIDR(product.price)}</p>
            <p className="pb-0.5 text-xs text-slate-400">/ {product.unit ?? "paket"}</p>
          </div>

          <p
            className={`mt-1.5 text-sm font-semibold ${
              outOfStock ? "text-red-500" : "text-green-600"
            }`}
          >
            {outOfStock ? "Stok habis" : `Stok tersedia · ${formatNumberID(product.stock)} ${product.unit ?? ""}`}
          </p>

          {product.requiresPrescription && (
            <div role="alert" className="mt-3 flex gap-2.5 rounded-2xl bg-amber-50 p-3.5 ring-1 ring-inset ring-amber-600/20">
              <ShieldAlert size={20} className="shrink-0 text-amber-600" aria-hidden />
              <p className="text-xs leading-relaxed text-amber-800">
                <strong>Perhatian:</strong> obat ini termasuk obat keras dan memerlukan resep
                dokter. Pesanan Anda akan diverifikasi apoteker — siapkan foto resep saat
                konsultasi atau pengambilan. Rekomendasi apa pun di aplikasi ini{" "}
                <strong>bukan diagnosis dokter</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Informasi produk */}
      <div className="mt-6 space-y-3 px-4">
        <Accordion title="Deskripsi">
          <p>{product.description}</p>
        </Accordion>
        {product.usage && (
          <Accordion title="Aturan Penggunaan">
            <p>{product.usage}</p>
            <p className="mt-2 text-xs text-slate-400">
              Selalu ikuti petunjuk apoteker/dokter. Jangan mengubah dosis tanpa nasihat tenaga
              kesehatan.
            </p>
          </Accordion>
        )}
        <Accordion title="Informasi Tambahan" defaultOpen={false}>
          <dl className="space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 font-semibold text-slate-500">ID Produk</dt>
              <dd className="text-right">{product.id}</dd>
            </div>
            {product.brand && (
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 font-semibold text-slate-500">Merek</dt>
                <dd className="text-right">{product.brand}</dd>
              </div>
            )}
            {product.additionalInfo && (
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 font-semibold text-slate-500">Catatan</dt>
                <dd className="text-right">{product.additionalInfo}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 font-semibold text-slate-500">Total Terjual</dt>
              <dd className="text-right">{formatNumberID(product.sold)}</dd>
            </div>
          </dl>
          <p className="mt-3 flex gap-1.5 text-xs text-slate-400">
            <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
            Informasi dalam aplikasi ini bukan pengganti diagnosis atau pemeriksaan tenaga
            kesehatan.
          </p>
        </Accordion>
      </div>

      {/* Sticky action bar: [ - 1 + ] [ Tambah ke Keranjang ] */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-nav backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Stepper
            value={qty}
            onChange={setQty}
            min={1}
            max={Math.max(product.stock, 1)}
            label={`Jumlah ${product.name}`}
          />
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => handleAdd(false)}
            disabled={outOfStock}
            aria-label="Tambah ke keranjang"
          >
            <ShoppingBag size={17} aria-hidden /> Keranjang
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleAdd(true)}
            disabled={outOfStock}
            aria-label="Beli sekarang"
          >
            <Zap size={17} aria-hidden /> Beli Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
