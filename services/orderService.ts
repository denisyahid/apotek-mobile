import { PermissionError, can, type Permission } from "@/lib/auth";
import { generateOrderNumber, nowISO } from "@/lib/id";
import { getRepositories } from "@/repositories";
import { notificationService } from "@/services/notificationService";
import type {
  Address,
  FulfillmentMethod,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Session,
} from "@/types";

function guard(actor: Session | null, permission: Permission): void {
  if (!can(actor, permission)) {
    throw new PermissionError();
  }
}

export interface CreateOrderInput {
  actor: Session | null;
  patientName: string;
  patientPhone: string;
  /** produk + jumlah yang dibeli (snapshot dibuat di sini) */
  items: { product: Product; qty: number }[];
  fulfillment: FulfillmentMethod;
  address?: Address;
}

export const orderService = {
  /** Membuat pesanan dari keranjang: hitung total, potong stok, buat history. */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    // Guest (tanpa akun) boleh memesan; admin tidak membuat pesanan pasien
    if (input.actor && input.actor.role === "admin") {
      throw new PermissionError("Admin tidak dapat membuat pesanan pasien.");
    }
    const repos = getRepositories();

    const items: OrderItem[] = input.items.map(({ product, qty }) => ({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      qty,
      requiresPrescription: product.requiresPrescription,
    }));

    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const shippingCost = await repos.shipping.estimate(
      input.fulfillment,
      input.address,
      subtotal
    );

    const order: Order = {
      id: generateOrderNumber(await repos.orders.countAll()),
      patientId: input.actor?.userId ?? "guest",
      patientName: input.patientName.trim(),
      patientPhone: input.patientPhone.trim(),
      items,
      fulfillment: input.fulfillment,
      address: input.fulfillment === "delivery" ? input.address : undefined,
      subtotal,
      shippingCost,
      total: subtotal + shippingCost,
      status: "pending_payment",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      history: [{ status: "created", at: nowISO() }],
    };

    await repos.orders.save(order);

    // potong stok produk (production: transaksi database)
    for (const it of input.items) {
      await repos.products.adjustStock(it.product.id, -it.qty);
    }

    await notificationService.notifyPatient({
      patientId: order.patientId,
      title: "Pesanan dibuat",
      body: `Pesanan ${order.id} berhasil dibuat. Silakan lakukan pembayaran.`,
      type: "order",
      link: `/pembayaran/${order.id}`,
    });
    await notificationService.notifyAdmin({
      title: "Pesanan baru",
      body: `${order.patientName} membuat pesanan ${order.id}.`,
      type: "order",
      link: `/admin/pesanan/${order.id}`,
    });

    return order;
  },

  async getById(id: string): Promise<Order | null> {
    return getRepositories().orders.getById(id);
  },

  async listAll(): Promise<Order[]> {
    return getRepositories().orders.getAll();
  },

  /** Pasien membatalkan pesanan yang belum dibayar */
  async cancelByPatient(orderId: string, actor: Session | null): Promise<Order> {
    const repos = getRepositories();
    const order = await repos.orders.getById(orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (order.patientId !== (actor?.userId ?? "guest")) {
      throw new PermissionError("Pesanan ini bukan milik Anda.");
    }
    if (order.status !== "pending_payment") {
      throw new Error("Pesanan yang sudah dibayar tidak dapat dibatalkan dari aplikasi. Hubungi apotek.");
    }
    return this.applyCancellation(order, "Dibatalkan oleh pasien.");
  },

  async cancelByAdmin(orderId: string, actor: Session | null, reason: string): Promise<Order> {
    guard(actor, "admin.orders.write");
    const repos = getRepositories();
    const order = await repos.orders.getById(orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (order.status === "completed" || order.status === "cancelled") {
      throw new Error("Pesanan yang sudah selesai/dibatalkan tidak dapat diubah.");
    }
    return this.applyCancellation(order, reason || "Dibatalkan oleh apotek.");
  },

  async applyCancellation(order: Order, note: string): Promise<Order> {
    const repos = getRepositories();
    const updated: Order = {
      ...order,
      status: "cancelled",
      updatedAt: nowISO(),
      history: [...order.history, { status: "cancelled", at: nowISO(), note }],
    };
    await repos.orders.save(updated);
    // kembalikan stok
    for (const it of updated.items) {
      await repos.products.adjustStock(it.productId, it.qty);
    }
    await notificationService.notifyPatient({
      patientId: updated.patientId,
      title: "Pesanan dibatalkan",
      body: `Pesanan ${updated.id} dibatalkan. ${note}`,
      type: "order",
      link: `/pesanan/${updated.id}`,
    });
    return updated;
  },

  /** Admin mengubah status pesanan (alur verifikasi → proses → kirim/selesai) */
  async changeStatus(
    orderId: string,
    status: OrderStatus,
    actor: Session | null,
    note?: string
  ): Promise<Order> {
    guard(actor, "admin.orders.write");
    return this.transitionInternal(orderId, status, note);
  },

  /**
   * Transisi internal antar-service (tanpa guard role — dipanggil alur sistem,
   * e.g. paymentService saat bukti diunggah). Setara server-to-server call;
   * production: jalankan di backend dengan service role.
   */
  async transitionInternal(
    orderId: string,
    status: OrderStatus,
    note?: string
  ): Promise<Order> {
    const repos = getRepositories();
    const order = await repos.orders.getById(orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");

    const updated: Order = {
      ...order,
      status,
      updatedAt: nowISO(),
      history: [...order.history, { status, at: nowISO(), note }],
    };
    await repos.orders.save(updated);

    await notificationService.notifyPatient({
      patientId: updated.patientId,
      title: `Pesanan ${updated.id} diperbarui`,
      body: note ?? `Status pesanan kini: ${labelFor(status)}.`,
      type: "order",
      link: `/pesanan/${updated.id}`,
    });
    return updated;
  },

  /** Admin mengatur ongkos kirim manual untuk satu pesanan (sebelum konfirmasi bayar) */
  async setShippingCost(orderId: string, cost: number, actor: Session | null): Promise<Order> {
    guard(actor, "admin.orders.write");
    const repos = getRepositories();
    const order = await repos.orders.getById(orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (order.status !== "pending_payment" && order.status !== "waiting_confirmation") {
      throw new Error("Ongkos kirim hanya dapat diatur sebelum pembayaran dikonfirmasi.");
    }
    const safeCost = Math.max(0, Math.round(cost));
    const updated: Order = {
      ...order,
      shippingCost: safeCost,
      total: order.subtotal + safeCost,
      updatedAt: nowISO(),
    };
    await repos.orders.save(updated);
    return updated;
  },

  /** Pasien mengonfirmasi pesanan diterima/diambil */
  async completeByPatient(orderId: string, actor: Session | null): Promise<Order> {
    const repos = getRepositories();
    const order = await repos.orders.getById(orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (order.patientId !== (actor?.userId ?? "guest")) {
      throw new PermissionError("Pesanan ini bukan milik Anda.");
    }
    const allowed: OrderStatus[] = ["ready_to_pickup", "shipping"];
    if (!allowed.includes(order.status)) {
      throw new Error("Pesanan belum bisa ditandai selesai.");
    }
    const updated: Order = {
      ...order,
      status: "completed",
      updatedAt: nowISO(),
      history: [
        ...order.history,
        { status: "completed", at: nowISO(), note: "Dikonfirmasi diterima oleh pasien" },
      ],
    };
    await repos.orders.save(updated);
    return updated;
  },
};

function labelFor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending_payment: "Menunggu Pembayaran",
    waiting_confirmation: "Menunggu Konfirmasi",
    payment_confirmed: "Pembayaran Dikonfirmasi",
    processing: "Pesanan Diproses",
    ready_to_pickup: "Siap Diambil",
    shipping: "Sedang Dikirim",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return map[status];
}
