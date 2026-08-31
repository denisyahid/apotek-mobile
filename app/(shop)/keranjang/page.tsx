"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingBag, ShoppingCart, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { EmptyState, ListSkeleton } from "@/components/ui/StateViews";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { formatIDR } from "@/lib/format";
import { getRepositories } from "@/repositories";
import type { Product } from "@/types";

interface CartRow {
  product: Product | null;
  qty: number;
  addedAt: string;
}

export default function CartPage() {
  const router = useRouter();
  const { items, setQty, remove, ready } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<Record<string, Product | null>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // muat data produk untuk setiap item keranjang
  const loadProducts = useCallback(async () => {
    const repo = getRepositories();
    const entries = await Promise.all(
      items.map(async (item) => {
        const p = await repo.products.getById(item.productId);
        return [item.productId, p] as const;
      })
    );
    setProducts(Object.fromEntries(entries));
    setSelected((prev) => {
      const next = new Set(items.map((i) => i.productId).filter((id) => prev.has(id)));
      if (prev.size === 0) return new Set(items.map((i) => i.productId));
      return next;
    });
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.productId).join(",")]);

  useEffect(() => {
    if (ready) loadProducts();
  }, [ready, loadProducts]);

  const rows: CartRow[] = useMemo(
    () =>
      items.map((i) => ({
        product: products[i.productId] ?? null,
        qty: i.qty,
        addedAt: i.addedAt,
      })),
    [items, products]
  );

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.product?.id ?? ""));
  const selectedRows = rows.filter((r) => r.product && selected.has(r.product.id));
  /** Checkout memroses seluruh item yang valid (tersedia & jumlah ≤ stok) */
  const checkoutRows = rows.filter(
    (r) => r.product && r.product.stock > 0 && r.qty <= r.product.stock
  );
  const hasBlockingIssue = rows.some(
    (r) => !r.product || r.product.stock <= 0 || r.qty > r.product.stock
  );
  const total = checkoutRows.reduce((sum, r) => sum + (r.product?.price ?? 0) * r.qty, 0);
  const totalQty = checkoutRows.reduce((sum, r) => sum + r.qty, 0);

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.product?.id ?? "").filter(Boolean)));
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSelected = () => {
    selectedRows.forEach((r) => remove(r.product!.id));
    setSelected(new Set());
    toast("Produk terpilih dihapus dari keranjang", "success");
  };

  if (loading && !ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-4">
        <h1 className="mb-4 text-lg font-extrabold text-slate-800">Keranjang</h1>
        <ListSkeleton rows={3} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-4">
        <h1 className="text-lg font-extrabold text-slate-800">Keranjang</h1>
        <EmptyState
          icon={<ShoppingCart size={36} aria-hidden />}
          title="Keranjang Anda masih kosong"
          description="Cari obat yang Anda butuhkan, atau konsultasikan dengan apoteker kami."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/obat"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-bold text-white"
              >
                Mulai Belanja
              </Link>
              <Link
                href="/konsultasi"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-primary-700 ring-1 ring-primary-600/30"
              >
                Tanya Apoteker
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 pb-36">
      <h1 className="text-lg font-extrabold text-slate-800">Keranjang</h1>

      {/* Pilih semua + hapus terpilih */}
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-card ring-1 ring-slate-900/5">
        <label className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Pilih semua produk"
            className="h-5 w-5 accent-primary-600"
          />
          <span className="text-sm font-bold text-slate-700">
            Semua {rows.length > 0 && <span className="font-normal text-slate-400">({rows.length} produk)</span>}
          </span>
        </label>
        {selectedRows.length > 0 && (
          <button
            type="button"
            onClick={deleteSelected}
            className="flex min-h-[44px] items-center gap-1.5 px-2 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} aria-hidden /> Hapus
          </button>
        )}
      </div>

      {/* Daftar item */}
      <ul className="mt-3 space-y-3">
        {rows.map((row) => {
          const p = row.product;
          const isSelected = p ? selected.has(p.id) : false;
          const unavailable = !p || p.stock <= 0;
          const maxQty = p ? Math.max(p.stock, 1) : 1;
          const overStock = p ? row.qty > p.stock : false;

          return (
            <li
              key={row.product?.id ?? row.addedAt}
              className={`flex gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-slate-900/5 transition-opacity ${
                !isSelected ? "opacity-75" : ""
              }`}
            >
              <label className="flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => p && toggle(p.id)}
                  disabled={!p}
                  aria-label={`Pilih ${p?.name ?? "produk"}`}
                  className="h-5 w-5 accent-primary-600"
                />
              </label>

              <Link
                href={p ? `/obat/${p.id}` : "#"}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50"
                aria-hidden
                tabIndex={-1}
              >
                {p && <Image src={p.image} alt="" fill sizes="80px" className="object-cover" />}
              </Link>

              <div className="min-w-0 flex-1">
                {!p ? (
                  <div className="flex h-full flex-col justify-center">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                      <TriangleAlert size={15} className="text-amber-500" aria-hidden />
                      Produk tidak lagi tersedia
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(row.product?.id ?? "")}
                      className="mt-1 self-start text-xs font-bold text-red-600"
                    >
                      Hapus dari keranjang
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href={`/obat/${p.id}`} className="block">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="mt-0.5 text-[15px] font-extrabold text-slate-900">
                      {formatIDR(p.price)}
                    </p>
                    {unavailable ? (
                      <p className="mt-1 text-xs font-bold text-red-500">Stok habis</p>
                    ) : overStock ? (
                      <p className="mt-1 text-xs font-bold text-amber-600">
                        Stok tersisa {p.stock} — kurangi jumlahnya
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between">
                      <Stepper
                        size="sm"
                        value={Math.min(row.qty, maxQty)}
                        min={1}
                        max={maxQty}
                        onChange={(next) => setQty(p.id, next)}
                        label={`Jumlah ${p.name}`}
                      />
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400">
                          Subtotal{" "}
                          <span className="font-bold text-slate-700">
                            {formatIDR(p.price * Math.min(row.qty, maxQty))}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          className="mt-1 inline-flex min-h-[36px] items-center gap-1 px-1 text-xs font-bold text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={13} aria-hidden /> Hapus
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-nav backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500">
              Total{totalQty > 0 ? ` (${totalQty} item)` : ""}
            </p>
            <p className="text-lg font-extrabold text-slate-900">{formatIDR(total)}</p>
          </div>
          <Button
            size="lg"
            className="px-8"
            disabled={checkoutRows.length === 0}
            onClick={() => {
              if (hasBlockingIssue) {
                toast("Perbaiki dulu item yang habis/melebihi stok", "warning");
                return;
              }
              router.push("/checkout");
            }}
          >
            <ShoppingBag size={18} aria-hidden /> Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
