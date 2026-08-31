"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/StateViews";
import { Badge } from "@/components/ui/Badge";
import { formatIDR } from "@/lib/format";
import { getRepositories } from "@/repositories";
import type { Category, Product } from "@/types";

/**
 * Sheet pencarian produk untuk admin saat merekomendasikan obat ke pasien.
 * Hanya apoteker (manusia) yang memilih — tidak ada diagnosis otomatis.
 */
export function RecommendProductSheet({
  open,
  onClose,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (product: Product) => Promise<void>;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setQuery("");
    Promise.all([
      getRepositories().products.getAll({ sort: "popular" }),
      getRepositories().categories.getAll(),
    ]).then(([list, cats]) => {
      setProducts(list);
      setCategories(cats);
    });
  }, [open]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q) ||
          (categories.find((c) => c.id === p.categoryId)?.name.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 20);
  }, [products, categories, query]);

  const send = async () => {
    if (!selected) return;
    setSending(true);
    try {
      await onSend(selected);
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Rekomendasikan Obat"
      footer={
        <Button fullWidth size="lg" disabled={!selected} loading={sending} onClick={send}>
          <Send size={17} aria-hidden /> Kirim Rekomendasi
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari obat untuk direkomendasikan…"
            aria-label="Cari produk"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/25"
          />
        </div>

        {selected && (
          <p className="rounded-xl bg-primary-50 px-3.5 py-2.5 text-xs font-semibold text-primary-800">
            Terpilih: {selected.name} · {formatIDR(selected.price)}
          </p>
        )}

        {visible.length === 0 ? (
          <EmptyState title="Produk tidak ditemukan" description="Coba kata kunci lain." />
        ) : (
          <ul className="space-y-2" role="listbox" aria-label="Daftar produk">
            {visible.map((p) => {
              const isSelected = selected?.id === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setSelected(p)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left ring-1 transition-colors ${
                      isSelected
                        ? "bg-primary-50 ring-2 ring-primary-600"
                        : "bg-white ring-slate-900/5 hover:bg-slate-50"
                    }`}
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                      <Image src={p.image} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 block text-sm font-bold text-slate-800">{p.name}</span>
                      <span className="block text-xs text-slate-400">
                        {categories.find((c) => c.id === p.categoryId)?.name} · Stok {p.stock}
                      </span>
                      <span className="mt-0.5 block text-sm font-extrabold text-slate-900">
                        {formatIDR(p.price)}
                      </span>
                    </span>
                    {p.requiresPrescription && <Badge tone="amber">Resep</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
          ⚠️ Rekomendasi dikirim oleh apoteker dan bersifat bantuan memilih produk — bukan
          diagnosis medis. Untuk obat keras, pastikan pasien memiliki resep dokter.
        </p>
      </div>
    </BottomSheet>
  );
}
