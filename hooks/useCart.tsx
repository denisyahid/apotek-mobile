"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DATA_CHANGED_EVENT, StorageKeys } from "@/lib/storage";
import { getRepositories } from "@/repositories";
import type { CartItem, Product } from "@/types";

interface CartContextValue {
  items: CartItem[];
  /** jumlah unit (untuk badge bottom nav) */
  count: number;
  ready: boolean;
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  qtyOf: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const stored = await getRepositories().cart.getItems();
    setItems(stored);
  }, []);

  useEffect(() => {
    let mounted = true;
    getRepositories()
      .cart.getItems()
      .then((stored) => mounted && setItems(stored))
      .finally(() => mounted && setReady(true));

    const onDataChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (detail?.key === StorageKeys.cart) reload();
    };
    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);
    return () => {
      mounted = false;
      window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
    };
  }, [reload]);

  const persist = useCallback(async (next: CartItem[]) => {
    setItems(next);
    await getRepositories().cart.setItems(next);
  }, []);

  const add = useCallback(
    (product: Product, qty = 1) => {
      const existing = items.find((i) => i.productId === product.id);
      const currentQty = existing?.qty ?? 0;
      const nextQty = Math.min(currentQty + qty, Math.max(product.stock, 0));
      if (nextQty <= 0) return;
      if (existing) {
        persist(
          items.map((i) => (i.productId === product.id ? { ...i, qty: nextQty } : i))
        );
      } else {
        persist([
          ...items,
          { productId: product.id, qty: nextQty, addedAt: new Date().toISOString() },
        ]);
      }
    },
    [items, persist]
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      if (qty <= 0) {
        persist(items.filter((i) => i.productId !== productId));
        return;
      }
      persist(items.map((i) => (i.productId === productId ? { ...i, qty } : i)));
    },
    [items, persist]
  );

  const remove = useCallback(
    (productId: string) => {
      persist(items.filter((i) => i.productId !== productId));
    },
    [items, persist]
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  const qtyOf = useCallback(
    (productId: string) => items.find((i) => i.productId === productId)?.qty ?? 0,
    [items]
  );

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, ready, add, setQty, remove, clear, qtyOf }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart harus dipakai di dalam CartProvider");
  return ctx;
}
