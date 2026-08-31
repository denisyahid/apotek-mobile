import { generateId, nowISO } from "@/lib/id";
import { readJson, writeJson, StorageKeys } from "@/lib/storage";
import { ensureSeeded } from "@/repositories/local/seed";
import type {
  OrderRepository,
  PaymentProofRepository,
  PaymentRepository,
} from "@/repositories/types";
import type { Order, Payment, PaymentProof } from "@/types";

/**
 * Order + Payment + PaymentProof pada LocalStorage.
 * PROTOTYPE: bukti pembayaran disimpan sebagai data URL base64 di LocalStorage —
 * ini HANYA simulasi. Production: unggah file ke Supabase Storage dan simpan
 * URL-nya (SupabasePaymentProofRepository) — lihat MIGRATION_TO_SUPABASE.md.
 */

export class LocalOrderRepository implements OrderRepository {
  constructor() {
    ensureSeeded();
  }

  private list(): Order[] {
    return readJson<Order[]>(StorageKeys.orders, []);
  }

  async getAll(): Promise<Order[]> {
    return this.list().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string): Promise<Order | null> {
    return this.list().find((o) => o.id === id) ?? null;
  }

  async save(order: Order): Promise<Order> {
    const list = this.list();
    const idx = list.findIndex((o) => o.id === order.id);
    if (idx >= 0) list[idx] = order;
    else list.push(order);
    writeJson(StorageKeys.orders, list);
    return order;
  }

  async remove(id: string): Promise<void> {
    writeJson(
      StorageKeys.orders,
      this.list().filter((o) => o.id !== id)
    );
  }

  async countAll(): Promise<number> {
    return this.list().length;
  }
}

export class LocalPaymentRepository implements PaymentRepository {
  constructor() {
    ensureSeeded();
  }

  private list(): Payment[] {
    return readJson<Payment[]>(StorageKeys.payments, []);
  }

  async getAll(): Promise<Payment[]> {
    return this.list();
  }

  async getByOrder(orderId: string): Promise<Payment | null> {
    return this.list().find((p) => p.orderId === orderId) ?? null;
  }

  async save(payment: Payment): Promise<Payment> {
    const list = this.list();
    const idx = list.findIndex((p) => p.id === payment.id);
    if (idx >= 0) list[idx] = payment;
    else list.push(payment);
    writeJson(StorageKeys.payments, list);
    return payment;
  }
}

export class LocalPaymentProofRepository implements PaymentProofRepository {
  constructor() {
    ensureSeeded();
  }

  private list(): PaymentProof[] {
    return readJson<PaymentProof[]>(StorageKeys.paymentProofs, []);
  }

  /**
   * Prototype: `dataUrl` (base64) disimpan di LocalStorage.
   * Production (SupabasePaymentProofRepository): unggah `dataUrl` ke bucket
   * `payment-proofs`, lalu simpan baris metadata dengan `url` publik.
   */
  async upload(input: {
    orderId: string;
    uploadedBy: string;
    dataUrl: string;
    fileName: string;
    mimeType: string;
    size: number;
  }): Promise<PaymentProof> {
    const proof: PaymentProof = {
      id: generateId("PRF"),
      orderId: input.orderId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      dataUrl: input.dataUrl,
      uploadedAt: nowISO(),
      uploadedBy: input.uploadedBy,
    };
    const list = this.list();
    const idx = list.findIndex((p) => p.orderId === input.orderId);
    if (idx >= 0) list[idx] = proof;
    else list.push(proof);
    writeJson(StorageKeys.paymentProofs, list);
    return proof;
  }

  async getByOrder(orderId: string): Promise<PaymentProof | null> {
    return this.list().find((p) => p.orderId === orderId) ?? null;
  }

  async getById(id: string): Promise<PaymentProof | null> {
    return this.list().find((p) => p.id === id) ?? null;
  }
}
