"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { CategoryIcon } from "@/features/product/CategoryIcon";
import { ProductCard } from "@/features/product/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, ErrorState, ProductGridSkeleton } from "@/components/ui/StateViews";
import { useDebounce } from "@/hooks/useDebounce";
import { formatIDR } from "@/lib/format";
import { getRepositories } from "@/repositories";
import type { Category, Product, ProductSort } from "@/types";

const SORTS: { id: ProductSort; label: string }[] = [
  { id: "popular", label: "Paling Populer" },
  { id: "price_asc", label: "Harga Terendah" },
  { id: "price_desc", label: "Harga Tertinggi" },
  { id: "rating", label: "Rating Tertinggi" },
  { id: "newest", label: "Terbaru" },
];

interface FilterState {
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sort: ProductSort;
}

/** Browser katalog: search real-time (debounced) + filter bottom sheet + sorting */
export function MedicineBrowser() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const debouncedQuery = useDebounce(query, 250);
  const [filters, setFilters] = useState<FilterState>({
    categoryId: "",
    minPrice: "",
    maxPrice: "",
    inStockOnly: false,
    sort: (params.get("sort") as ProductSort) || "popular",
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // kategori dari URL (?kategori=slug) — dari home
  useEffect(() => {
    const slug = params.get("kategori");
    if (!slug) return;
    getRepositories()
      .categories.getBySlug(slug)
      .then((cat) => cat && setFilters((f) => ({ ...f, categoryId: cat.id })));
  }, [params]);

  const load = useCallback(async () => {
    setError(false);
    try {
      const repo = getRepositories();
      const min = filters.minPrice ? Number(filters.minPrice) : undefined;
      const max = filters.maxPrice ? Number(filters.maxPrice) : undefined;
      const [found, cats] = await Promise.all([
        repo.products.search(debouncedQuery, {
          categoryId: filters.categoryId || undefined,
          minPrice: min,
          maxPrice: max,
          inStockOnly: filters.inStockOnly,
          sort: filters.sort,
        }),
        repo.categories.getAll(),
      ]);
      setProducts(found);
      setCategories(cats);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters]);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(load, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const activeCategory = categories.find((c) => c.id === filters.categoryId);
  const activeFilterCount =
    (activeCategory ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);
  const hasQueryOrFilter = Boolean(
    debouncedQuery || activeFilterCount > 0 || filters.sort !== "popular"
  );

  const categoryChips = useMemo(
    () => [{ id: "", name: "Semua", slug: "", icon: "pill" as const }, ...categories],
    [categories]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={18}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama obat, kategori, atau gejala…"
          aria-label="Cari obat"
          enterKeyHint="search"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-10 text-[15px] shadow-card placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus pencarian"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X size={16} aria-hidden />
          </button>
        )}
      </div>

      {/* Baris kontrol: kategori chips + filter + sort */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-bold text-slate-700 shadow-card ring-1 ring-slate-900/5"
          aria-label={`Buka filter${activeFilterCount > 0 ? ` (${activeFilterCount} aktif)` : ""}`}
        >
          <SlidersHorizontal size={16} aria-hidden className="text-primary-600" />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="relative min-w-0 flex-1">
          <ArrowUpDown
            size={15}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-600"
          />
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as ProductSort }))}
            aria-label="Urutkan produk"
            className="h-[44px] w-full appearance-none rounded-xl bg-white pl-10 pr-8 text-sm font-semibold text-slate-700 shadow-card ring-1 ring-slate-900/5 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chips kategori */}
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {categoryChips.map((chip) => {
          const active = filters.categoryId === chip.id;
          return (
            <button
              key={chip.id || "all"}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, categoryId: chip.id }))}
              aria-pressed={active}
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors ${
                active
                  ? "bg-primary-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <CategoryIcon icon={chip.icon ?? "pill"} size={14} />
              {chip.name}
            </button>
          );
        })}
      </div>

      {/* Ringkasan hasil */}
      <div className="mt-4 flex items-center justify-between">
        <p aria-live="polite" className="text-sm text-slate-500">
          {loading ? (
            "Mencari produk…"
          ) : (
            <>
              <span className="font-bold text-slate-700">{products.length}</span> produk
              {debouncedQuery && (
                <>
                  {" "}
                  untuk <span className="font-semibold text-slate-700">“{debouncedQuery}”</span>
                </>
              )}
            </>
          )}
        </p>
        {activeCategory && (
          <Badge tone="teal">
            <CategoryIcon icon={activeCategory.icon} size={12} /> {activeCategory.name}
          </Badge>
        )}
      </div>

      {/* Hasil */}
      <div className="mt-3">
        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : products.length === 0 ? (
          <EmptyState
            title="Obat tidak ditemukan"
            description={
              hasQueryOrFilter
                ? "Coba kata kunci lain atau kurangi filter pencarian Anda."
                : "Katalog masih kosong. Silakan cek kembali nanti."
            }
            action={
              hasQueryOrFilter ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilters({
                      categoryId: "",
                      minPrice: "",
                      maxPrice: "",
                      inStockOnly: false,
                      sort: "popular",
                    });
                  }}
                >
                  Reset Pencarian
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                categoryName={categories.find((c) => c.id === p.categoryId)?.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom sheet filter */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter Produk"
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() =>
                setFilters((f) => ({ ...f, minPrice: "", maxPrice: "", inStockOnly: false }))
              }
            >
              Atur Ulang
            </Button>
            <Button fullWidth onClick={() => setSheetOpen(false)}>
              Terapkan Filter
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-700">Kategori</p>
            <div className="flex flex-wrap gap-2">
              {categoryChips.map((chip) => {
                const active = filters.categoryId === chip.id;
                return (
                  <button
                    key={chip.id || "all"}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilters((f) => ({ ...f, categoryId: chip.id }))}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors ${
                      active
                        ? "bg-primary-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <CategoryIcon icon={chip.icon ?? "pill"} size={14} />
                    {chip.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-slate-700">Rentang Harga (Rp)</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Minimum"
                aria-label="Harga minimum"
                value={filters.minPrice}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                min={0}
              />
              <span className="text-slate-400">—</span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Maksimum"
                aria-label="Harga maksimum"
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                min={0}
              />
            </div>
            {filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice) && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                Harga minimum tidak boleh lebih besar dari maksimum.
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { label: "< Rp 10.000", min: "", max: "10000" },
                { label: "Rp 10–50rb", min: "10000", max: "50000" },
                { label: "> Rp 50.000", min: "50000", max: "" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({ ...f, minPrice: preset.min, maxPrice: preset.max }))
                  }
                  className="min-h-[40px] rounded-full bg-slate-100 px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-3">
            <span className="text-sm font-semibold text-slate-700">Hanya stok tersedia</span>
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => setFilters((f) => ({ ...f, inStockOnly: e.target.checked }))}
              className="h-5 w-5 accent-primary-600"
            />
          </label>

          {activeCategory?.description && (
            <p className="rounded-xl bg-primary-50 p-3 text-xs leading-relaxed text-primary-800">
              {activeCategory.description}
            </p>
          )}

          <Select
            label="Urutkan"
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as ProductSort }))}
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Harga produk: {formatIDR(0)} menyesuaikan katalog apotek.{" "}
            <Link href="/konsultasi" className="font-semibold text-primary-600">
              Butuh bantuan? Konsultasi gratis
            </Link>
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
