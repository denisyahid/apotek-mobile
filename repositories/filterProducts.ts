import type { Category, Product, ProductFilters } from "@/types";

/** Logika filter/sort/pencarian katalog — dipakai Json maupun Local repository. */
export function filterProducts(
  products: Product[],
  filters: ProductFilters,
  categories: Category[] = []
): Product[] {
  let result = [...products];

  if (!filters.includeInactive) {
    result = result.filter((p) => p.isActive);
  }

  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const catById = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
    result = result.filter((p) => {
      const haystacks = [
        p.name.toLowerCase(),
        p.brand?.toLowerCase() ?? "",
        p.description.toLowerCase(),
        catById.get(p.categoryId) ?? "",
      ];
      return haystacks.some((h) => h.includes(query));
    });
  }

  if (filters.categoryId) {
    result = result.filter((p) => p.categoryId === filters.categoryId);
  }

  if (typeof filters.minPrice === "number" && !Number.isNaN(filters.minPrice)) {
    result = result.filter((p) => p.price >= (filters.minPrice as number));
  }
  if (typeof filters.maxPrice === "number" && !Number.isNaN(filters.maxPrice)) {
    result = result.filter((p) => p.price <= (filters.maxPrice as number));
  }
  if (filters.inStockOnly) {
    result = result.filter((p) => p.stock > 0);
  }

  switch (filters.sort) {
    case "price_asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "popular":
    default:
      result.sort((a, b) => b.sold - a.sold);
      break;
  }

  if (filters.limit) {
    result = result.slice(0, filters.limit);
  }
  return result;
}
