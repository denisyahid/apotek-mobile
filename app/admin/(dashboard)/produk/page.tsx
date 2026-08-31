"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ProductFormSheet } from "@/features/admin/ProductFormSheet";
import { Badge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/StateViews";
import { useToast } from "@/hooks/useToast";
import { formatIDR } from "@/lib/format";
import { getRepositories } from "@/repositories";
import type { Category, Product } from "@/types";

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const repo = getRepositories();
      const [list, cats] = await Promise.all([
        repo.products.getAll({ includeInactive: true }),
        repo.categories.getAll(),
      ]);
      setProducts(list);
      setCategories(cats);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter && p.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, categoryFilter]);

  const adjustStock = async (product: Product, delta: number) => {
    const next = Math.max(0, product.stock + delta);
    await getRepositories().products.save({ ...product, stock: next });
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: next } : p)));
  };

  const toggleActive = async (product: Product) => {
    const next = { ...product, isActive: !product.isActive };
    await getRepositories().products.save(next);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? next : p)));
    toast(next.isActive ? "Produk diaktifkan" : "Produk dinonaktifkan", "info");
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await getRepositories().products.remove(deleting.id);
    setProducts((prev) => prev.filter((p) => p.id !== deleting.id));
    toast(`${deleting.name} dihapus`, "success");
    setDeleting(null);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800">Kelola Produk</h1>
          <p className="text-xs text-slate-400">{products.length} produk terdaftar</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <PackagePlus size={17} aria-hidden /> Tambah Obat
        </Button>
      </div>

      {/* Pencarian & filter */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama / ID / merek…"
            aria-label="Cari produk"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter kategori"
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:border-primary-500 focus:outline-none"
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Daftar produk */}
      <div className="mt-4">
        {loading ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : visible.length === 0 ? (
          <EmptyState
            title={products.length === 0 ? "Belum ada produk" : "Produk tidak ditemukan"}
            description={
              products.length === 0
                ? "Tambahkan obat pertama Anda untuk mulai berjualan."
                : "Coba kata kunci atau filter kategori lain."
            }
          />
        ) : (
          <>
            {/* Mobile: card list */}
            <ul className="space-y-3 lg:hidden">
              {visible.map((p) => (
                <li key={p.id} className="rounded-2xl bg-white p-3 shadow-card ring-1 ring-slate-900/5">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                      <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-slate-800">{p.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {categories.find((c) => c.id === p.categoryId)?.name} · {p.id}
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold text-slate-900">{formatIDR(p.price)}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge tone={p.stock > 10 ? "green" : p.stock > 0 ? "amber" : "red"}>
                          Stok {p.stock}
                        </Badge>
                        {p.requiresPrescription && <Badge tone="amber">Resep</Badge>}
                        {!p.isActive && <Badge tone="slate">Nonaktif</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => adjustStock(p, -1)}
                        aria-label={`Kurangi stok ${p.name}`}
                        className="flex h-11 w-11 items-center justify-center text-slate-600 hover:bg-slate-50"
                      >
                        <Minus size={15} aria-hidden />
                      </button>
                      <span className="w-10 text-center text-sm font-bold tabular-nums">{p.stock}</span>
                      <button
                        type="button"
                        onClick={() => adjustStock(p, 1)}
                        aria-label={`Tambah stok ${p.name}`}
                        className="flex h-11 w-11 items-center justify-center text-slate-600 hover:bg-slate-50"
                      >
                        <Plus size={15} aria-hidden />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleActive(p)}
                      className={`min-h-[44px] flex-1 rounded-xl text-xs font-bold ${
                        p.isActive ? "bg-slate-100 text-slate-600" : "bg-green-50 text-green-700"
                      }`}
                    >
                      {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      aria-label={`Edit ${p.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100"
                    >
                      <Pencil size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(p)}
                      aria-label={`Hapus ${p.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: tabel */}
            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5 lg:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Daftar produk apotek</caption>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    <th scope="col" className="px-4 py-3">Produk</th>
                    <th scope="col" className="px-4 py-3">Kategori</th>
                    <th scope="col" className="px-4 py-3 text-right">Harga</th>
                    <th scope="col" className="px-4 py-3 text-center">Stok</th>
                    <th scope="col" className="px-4 py-3 text-center">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                            <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">{p.name}</p>
                            <p className="text-[11px] text-slate-400">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {categories.find((c) => c.id === p.categoryId)?.name}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatIDR(p.price)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex min-h-[36px] items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            p.stock > 10
                              ? "bg-green-50 text-green-700"
                              : p.stock > 0
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.isActive ? (
                          <Badge tone="green">Aktif</Badge>
                        ) : (
                          <Badge tone="slate">Nonaktif</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustStock(p, -1)}
                            aria-label={`Kurangi stok ${p.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <Minus size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStock(p, 1)}
                            aria-label={`Tambah stok ${p.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <Plus size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(p)}
                            className="min-h-[40px] rounded-lg bg-slate-100 px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                          >
                            {p.isActive ? "Nonaktif" : "Aktif"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(p);
                              setFormOpen(true);
                            }}
                            aria-label={`Edit ${p.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100"
                          >
                            <Pencil size={15} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(p)}
                            aria-label={`Hapus ${p.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={15} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ProductFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        product={editing}
        categories={categories}
      />

      {/* Konfirmasi hapus */}
      <BottomSheet
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus Produk?"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={() => setDeleting(null)}>
              Batal
            </Button>
            <Button variant="danger" fullWidth onClick={confirmDelete}>
              <Trash2 size={16} aria-hidden /> Hapus
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          Produk <strong>{deleting?.name}</strong> akan dihapus dari katalog. Riwayat pesanan lama
          tidak terpengaruh.
        </p>
      </BottomSheet>
    </div>
  );
}
