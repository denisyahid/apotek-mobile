import paymentMethodsJson from "@/data/payment-methods.json";
import shippingJson from "@/data/shipping.json";
import { generateId, nowISO } from "@/lib/id";
import { readJson, writeJson, StorageKeys } from "@/lib/storage";
import { ensureSeeded } from "@/repositories/local/seed";
import type {
  NotificationRepository,
  PaymentMethodRepository,
  ShippingRepository,
} from "@/repositories/types";
import type {
  Address,
  AppNotification,
  FulfillmentMethod,
  PaymentMethod,
  Role,
  ShippingConfig,
} from "@/types";

const SEED_METHODS = paymentMethodsJson as unknown as PaymentMethod[];
const SEED_SHIPPING = shippingJson as unknown as ShippingConfig;

export class LocalNotificationRepository implements NotificationRepository {
  constructor() {
    ensureSeeded();
  }

  private list(): AppNotification[] {
    return readJson<AppNotification[]>(StorageKeys.notifications, []);
  }

  async getAll(audience: Role): Promise<AppNotification[]> {
    return this.list()
      .filter((n) => n.audience === audience)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async save(notification: AppNotification): Promise<AppNotification> {
    const list = this.list();
    const idx = list.findIndex((n) => n.id === notification.id);
    if (idx >= 0) list[idx] = notification;
    else list.push(notification);
    writeJson(StorageKeys.notifications, list);
    return notification;
  }

  async markRead(ids: string[]): Promise<void> {
    const set = new Set(ids);
    writeJson(
      StorageKeys.notifications,
      this.list().map((n) => (set.has(n.id) ? { ...n, read: true } : n))
    );
  }

  async markAllRead(audience: Role): Promise<void> {
    writeJson(
      StorageKeys.notifications,
      this.list().map((n) => (n.audience === audience ? { ...n, read: true } : n))
    );
  }
}

export class LocalPaymentMethodRepository implements PaymentMethodRepository {
  async getAll(): Promise<PaymentMethod[]> {
    return SEED_METHODS.filter((m) => m.isActive);
  }
  async getById(id: string): Promise<PaymentMethod | null> {
    return SEED_METHODS.find((m) => m.id === id) ?? null;
  }
}

export class LocalShippingRepository implements ShippingRepository {
  async getConfig(): Promise<ShippingConfig> {
    const stored = readJson<Partial<ShippingConfig>>(StorageKeys.shipping, {});
    return {
      ...SEED_SHIPPING,
      ...stored,
      pickup: { ...SEED_SHIPPING.pickup, ...(stored.pickup ?? {}) },
    };
  }

  async saveConfig(config: ShippingConfig): Promise<ShippingConfig> {
    writeJson(StorageKeys.shipping, config);
    return config;
  }

  /**
   * Prototype: tarif tetap yang diatur admin.
   * Production: panggil API ekspedisi (onkir berdasarkan alamat & berat).
   * Kontrak method ini sudah disiapkan agar UI tidak perlu berubah.
   */
  async estimate(method: FulfillmentMethod, _address?: Address, _subtotal?: number): Promise<number> {
    if (method === "pickup") return 0;
    const config = await this.getConfig();
    return config.shippingCost;
  }
}

export function newNotification(
  notification: Omit<AppNotification, "id" | "read" | "createdAt">
): AppNotification {
  return {
    ...notification,
    id: generateId("NTF"),
    read: false,
    createdAt: nowISO(),
  };
}
