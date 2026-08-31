import { isBrowser } from "@/lib/storage";
import { jsonRepositories } from "@/repositories/json";
import { LocalCartRepository } from "@/repositories/local/cart";
import { LocalCategoryRepository, LocalProductRepository } from "@/repositories/local/product";
import { LocalChatRepository } from "@/repositories/local/chat";
import {
  LocalOrderRepository,
  LocalPaymentProofRepository,
  LocalPaymentRepository,
} from "@/repositories/local/order";
import {
  LocalNotificationRepository,
  LocalPaymentMethodRepository,
  LocalShippingRepository,
} from "@/repositories/local/config";
import { LocalUserRepository } from "@/repositories/local/user";
import type { Repositories } from "@/repositories/types";

export { jsonRepositories };

/**
 * Service locator repository.
 * - Server (SSR/SEO)  → Json*Repository (baca seed JSON, read-only)
 * - Browser           → Local*Repository (LocalStorage + overlay seed)
 * Migrasi production: cukup ganti container ini menjadi Supabase*Repository.
 */

let clientContainer: Repositories | null = null;

function buildClientContainer(): Repositories {
  return {
    products: new LocalProductRepository(),
    categories: new LocalCategoryRepository(),
    cart: new LocalCartRepository(),
    orders: new LocalOrderRepository(),
    payments: new LocalPaymentRepository(),
    paymentProofs: new LocalPaymentProofRepository(),
    chat: new LocalChatRepository(),
    users: new LocalUserRepository(),
    notifications: new LocalNotificationRepository(),
    paymentMethods: new LocalPaymentMethodRepository(),
    shipping: new LocalShippingRepository(),
  };
}

export function getRepositories(): Repositories {
  if (!isBrowser()) {
    // server: repo read-only untuk SSR; repo LocalStorage aman dipanggil
    // (semua akses dibungkus guard isBrowser dan menjadi no-op di server)
    return {
      ...jsonRepositories,
      cart: new LocalCartRepository(),
      orders: new LocalOrderRepository(),
      payments: new LocalPaymentRepository(),
      paymentProofs: new LocalPaymentProofRepository(),
      chat: new LocalChatRepository(),
      notifications: new LocalNotificationRepository(),
      shipping: new LocalShippingRepository(),
    } as Repositories;
  }
  if (!clientContainer) {
    clientContainer = buildClientContainer();
  }
  return clientContainer;
}
