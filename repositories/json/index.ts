import medicinesJson from "@/data/medicines.json";
import categoriesJson from "@/data/categories.json";
import usersJson from "@/data/users.json";
import paymentMethodsJson from "@/data/payment-methods.json";
import shippingJson from "@/data/shipping.json";
import ordersJson from "@/data/orders.json";
import paymentsJson from "@/data/payments.json";
import consultationsJson from "@/data/consultations.json";
import type {
  Address,
  AppNotification,
  CartItem,
  Category,
  ChatMessage,
  Consultation,
  FulfillmentMethod,
  Order,
  Payment,
  PaymentMethod,
  PaymentProof,
  Product,
  ProductFilters,
  Role,
  Session,
  ShippingConfig,
  StoredUser,
  User,
} from "@/types";
import {
  CategoryRepository,
  ChatRepository,
  NotificationRepository,
  OrderRepository,
  PaymentMethodRepository,
  PaymentProofRepository,
  PaymentRepository,
  ProductRepository,
  ShippingRepository,
  UserRepository,
} from "@/repositories/types";
import { filterProducts } from "@/repositories/filterProducts";

/**
 * Implementasi READ-ONLY dari file JSON seed (aman untuk server & SEO).
 * Operasi tulis (admin) dilakukan oleh Local*Repository di browser.
 * Saat migrasi ke Supabase: ganti dengan Supabase*Repository yang membaca
 * tabel PostgreSQL — kontrak interface tetap sama.
 */

const SEED_PRODUCTS = medicinesJson as unknown as Product[];
const SEED_CATEGORIES = categoriesJson as unknown as Category[];
const SEED_USERS = usersJson as unknown as StoredUser[];
const SEED_PAYMENT_METHODS = paymentMethodsJson as unknown as PaymentMethod[];
const SEED_SHIPPING = shippingJson as unknown as ShippingConfig;
const SEED_ORDERS = ordersJson as unknown as Order[];
const SEED_PAYMENTS = paymentsJson.payments as unknown as Payment[];
const SEED_PROOFS = paymentsJson.proofs as unknown as PaymentProof[];
const SEED_CONSULTATIONS = consultationsJson as unknown as (Consultation & {
  messages: ChatMessage[];
})[];

export class JsonProductRepository implements ProductRepository {
  async getAll(filters: ProductFilters = {}): Promise<Product[]> {
    return filterProducts(SEED_PRODUCTS, filters, SEED_CATEGORIES);
  }
  async getById(id: string): Promise<Product | null> {
    return SEED_PRODUCTS.find((p) => p.id === id) ?? null;
  }
  async search(query: string, filters: Omit<ProductFilters, "query"> = {}): Promise<Product[]> {
    return this.getAll({ ...filters, query });
  }
  async save(): Promise<Product> {
    throw new Error("JsonProductRepository hanya untuk membaca (prototype).");
  }
  async remove(): Promise<void> {
    throw new Error("JsonProductRepository hanya untuk membaca (prototype).");
  }
  async adjustStock(): Promise<void> {
    throw new Error("JsonProductRepository hanya untuk membaca (prototype).");
  }
}

export class JsonCategoryRepository implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    return SEED_CATEGORIES;
  }
  async getById(id: string): Promise<Category | null> {
    return SEED_CATEGORIES.find((c) => c.id === id) ?? null;
  }
  async getBySlug(slug: string): Promise<Category | null> {
    return SEED_CATEGORIES.find((c) => c.slug === slug) ?? null;
  }
  async save(): Promise<Category> {
    throw new Error("JsonCategoryRepository hanya untuk membaca (prototype).");
  }
  async remove(): Promise<void> {
    throw new Error("JsonCategoryRepository hanya untuk membaca (prototype).");
  }
}

export class JsonUserRepository implements UserRepository {
  async getAll(): Promise<StoredUser[]> {
    return SEED_USERS;
  }
  async getById(id: string): Promise<User | null> {
    const u = SEED_USERS.find((x) => x.id === id);
    if (!u) return null;
    const { passwordHash: _ignored, ...rest } = u;
    return rest;
  }
  async findByEmail(email: string): Promise<StoredUser | null> {
    const target = email.trim().toLowerCase();
    return SEED_USERS.find((x) => x.email.toLowerCase() === target) ?? null;
  }
  async save(): Promise<StoredUser> {
    throw new Error("JsonUserRepository hanya untuk membaca (prototype).");
  }
  async getSession(): Promise<Session | null> {
    return null; // sesi hanya ada di browser (LocalStorage)
  }
  async setSession(): Promise<void> {
    /* no-op di server */
  }
}

export class JsonPaymentMethodRepository implements PaymentMethodRepository {
  async getAll(): Promise<PaymentMethod[]> {
    return SEED_PAYMENT_METHODS.filter((m) => m.isActive);
  }
  async getById(id: string): Promise<PaymentMethod | null> {
    return SEED_PAYMENT_METHODS.find((m) => m.id === id) ?? null;
  }
}

export class JsonShippingRepository implements ShippingRepository {
  async getConfig(): Promise<ShippingConfig> {
    return SEED_SHIPPING;
  }
  async saveConfig(): Promise<ShippingConfig> {
    throw new Error("JsonShippingRepository hanya untuk membaca (prototype).");
  }
  async estimate(method: FulfillmentMethod): Promise<number> {
    return method === "pickup" ? 0 : SEED_SHIPPING.shippingCost;
  }
}

/** Pembacaan seed order/pembayaran (dipakai untuk SSR & seeding LocalStorage) */
export function getSeedOrders(): Order[] {
  return SEED_ORDERS;
}
export function getSeedPayments(): Payment[] {
  return SEED_PAYMENTS;
}
export function getSeedProofs(): PaymentProof[] {
  return SEED_PROOFS;
}
export function getSeedConsultations(): Consultation[] {
  return SEED_CONSULTATIONS.map(({ messages: _m, ...rest }) => rest);
}
export function getSeedMessages(): Record<string, ChatMessage[]> {
  const map: Record<string, ChatMessage[]> = {};
  for (const c of SEED_CONSULTATIONS) {
    map[c.id] = c.messages;
  }
  return map;
}
export function getSeedCategories(): Category[] {
  return SEED_CATEGORIES;
}

/** container server-side (read-only) */
export const jsonRepositories = {
  products: new JsonProductRepository(),
  categories: new JsonCategoryRepository(),
  users: new JsonUserRepository(),
  paymentMethods: new JsonPaymentMethodRepository(),
  shipping: new JsonShippingRepository(),
};

export type { CartItem, AppNotification, Address, Role };
