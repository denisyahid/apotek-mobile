import medicinesJson from "@/data/medicines.json";
import { readJson, writeJson, StorageKeys } from "@/lib/storage";
import { getSeedCategories } from "@/repositories/json";
import { filterProducts } from "@/repositories/filterProducts";
import type { CategoryRepository, ProductRepository } from "@/repositories/types";
import type { Category, Product, ProductFilters } from "@/types";

/**
 * Overlay pattern: seed JSON = data dasar, LocalStorage = perubahan admin.
 * Saat migrasi ke Supabase: seluruh method di bawah cukup diganti query
 * ke tabel `products`/`categories` — komponen UI tidak berubah.
 */

interface ProductOverrides {
  upserts: Record<string, Product>;
  deleted: Record<string, boolean>;
}

interface CategoryOverrides {
  upserts: Record<string, Category>;
  deleted: Record<string, boolean>;
}

const SEED_PRODUCTS = medicinesJson as unknown as Product[];

function readOverrides(): ProductOverrides {
  return readJson<ProductOverrides>(StorageKeys.productOverrides, {
    upserts: {},
    deleted: {},
  });
}

function writeOverrides(o: ProductOverrides) {
  writeJson(StorageKeys.productOverrides, o);
}

export class LocalProductRepository implements ProductRepository {
  async getAll(filters: ProductFilters = {}): Promise<Product[]> {
    return filterProducts(this.merged(), filters, getSeedCategories());
  }

  async getById(id: string): Promise<Product | null> {
    const o = readOverrides();
    if (o.deleted[id]) return null;
    return o.upserts[id] ?? SEED_PRODUCTS.find((p) => p.id === id) ?? null;
  }

  async search(query: string, filters: Omit<ProductFilters, "query"> = {}): Promise<Product[]> {
    return this.getAll({ ...filters, query });
  }

  async save(product: Product): Promise<Product> {
    const o = readOverrides();
    o.upserts[product.id] = product;
    delete o.deleted[product.id];
    writeOverrides(o);
    return product;
  }

  async remove(id: string): Promise<void> {
    const o = readOverrides();
    delete o.upserts[id];
    o.deleted[id] = true;
    writeOverrides(o);
  }

  async adjustStock(id: string, delta: number): Promise<void> {
    const current = await this.getById(id);
    if (!current) return;
    const o = readOverrides();
    o.upserts[id] = {
      ...current,
      stock: Math.max(0, current.stock + delta),
    };
    writeOverrides(o);
  }

  private merged(): Product[] {
    const o = readOverrides();
    const base = SEED_PRODUCTS.map((p) => o.upserts[p.id] ?? p).filter(
      (p) => !o.deleted[p.id]
    );
    // produk baru yang dibuat admin (tidak ada di seed)
    const extra = Object.values(o.upserts).filter(
      (p) => !SEED_PRODUCTS.some((s) => s.id === p.id)
    );
    return [...base, ...extra];
  }
}

export class LocalCategoryRepository implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    const o = readJson<CategoryOverrides>(StorageKeys.categoryOverrides, {
      upserts: {},
      deleted: {},
    });
    const base = getSeedCategories().map((c) => o.upserts[c.id] ?? c).filter((c) => !o.deleted[c.id]);
    const extra = Object.values(o.upserts).filter(
      (c) => !getSeedCategories().some((s) => s.id === c.id)
    );
    return [...base, ...extra];
  }

  async getById(id: string): Promise<Category | null> {
    return (await this.getAll()).find((c) => c.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return (await this.getAll()).find((c) => c.slug === slug) ?? null;
  }

  async save(category: Category): Promise<Category> {
    const o = readJson<CategoryOverrides>(StorageKeys.categoryOverrides, {
      upserts: {},
      deleted: {},
    });
    o.upserts[category.id] = category;
    delete o.deleted[category.id];
    writeJson(StorageKeys.categoryOverrides, o);
    return category;
  }

  async remove(id: string): Promise<void> {
    const o = readJson<CategoryOverrides>(StorageKeys.categoryOverrides, {
      upserts: {},
      deleted: {},
    });
    delete o.upserts[id];
    o.deleted[id] = true;
    writeJson(StorageKeys.categoryOverrides, o);
  }
}
