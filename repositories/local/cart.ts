import { readJson, writeJson, StorageKeys } from "@/lib/storage";
import type { CartRepository } from "@/repositories/types";
import type { CartItem } from "@/types";

/** Keranjang belanja — LocalStorage (per perangkat). Production: tabel `carts`. */
export class LocalCartRepository implements CartRepository {
  async getItems(): Promise<CartItem[]> {
    return readJson<CartItem[]>(StorageKeys.cart, []);
  }
  async setItems(items: CartItem[]): Promise<void> {
    writeJson(StorageKeys.cart, items);
  }
  async clear(): Promise<void> {
    writeJson(StorageKeys.cart, []);
  }
}
