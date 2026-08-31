import { PermissionError, can } from "@/lib/auth";
import { nowISO } from "@/lib/id";
import { getRepositories } from "@/repositories";
import { orderService } from "@/services/orderService";
import { notificationService } from "@/services/notificationService";
import type { Payment, PaymentMethod, PaymentProof, Session } from "@/types";

/**
 * Alur pembayaran prototype:
 * pesanan dibuat → pilih metode → transfer/QRIS → unggah bukti (LocalStorage)
 * → admin konfirmasi / tolak (dengan alasan).
 */
export const paymentService = {
  async getMethods(): Promise<PaymentMethod[]> {
    return getRepositories().paymentMethods.getAll();
  },

  async getForOrder(orderId: string): Promise<Payment | null> {
    return getRepositories().payments.getByOrder(orderId);
  },

  async getProofForOrder(orderId: string): Promise<PaymentProof | null> {
    return getRepositories().paymentProofs.getByOrder(orderId);
  },

  /** pasien memilih metode pembayaran pada halaman pembayaran */
  async selectMethod(orderId: string, methodId: string): Promise<Payment> {
    const repos = getRepositories();
    const method = await repos.paymentMethods.getById(methodId);
    if (!method) throw new Error("Metode pembayaran tidak ditemukan.");
    const order = await repos.orders.getById(orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");

    const existing = await repos.payments.getByOrder(orderId);
    const payment: Payment = existing
      ? { ...existing, methodId, methodName: method.name, amount: order.total, updatedAt: nowISO() }
      : {
          id: `PAY-${orderId}`,
          orderId,
          methodId,
          methodName: method.name,
          amount: order.total,
          status: "awaiting_proof",
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
    await repos.payments.save(payment);
    return payment;
  },

  /**
   * Pasien mengunggah bukti pembayaran.
   * Prototype: dataUrl base64 disimpan LocalStorage — production: Supabase Storage.
   */
  async submitProof(
    orderId: string,
    actor: Session | null,
    image: { dataUrl: string; fileName: string; mimeType: string; size: number }
  ): Promise<PaymentProof> {
    const repos = getRepositories();
    const order = await repos.orders.getById(orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (order.status !== "pending_payment") {
      throw new Error("Pesanan ini tidak sedang menunggu pembayaran.");
    }

    const proof = await repos.paymentProofs.upload({
      orderId,
      uploadedBy: actor?.userId ?? "guest",
      ...image,
    });

    const existing = await repos.payments.getByOrder(orderId);
    if (existing) {
      await repos.payments.save({
        ...existing,
        status: "waiting_confirmation",
        proofId: proof.id,
        updatedAt: nowISO(),
      });
    }

    await orderService.transitionInternal(
      orderId,
      "waiting_confirmation",
      "Bukti pembayaran diterima, menunggu verifikasi apoteker"
    );

    await notificationService.notifyPatient({
      patientId: order.patientId,
      title: "Bukti pembayaran diterima",
      body: `Bukti pembayaran pesanan ${orderId} sudah diterima dan sedang diverifikasi.`,
      type: "payment",
      link: `/pesanan/${orderId}`,
    });
    await notificationService.notifyAdmin({
      title: "Konfirmasi pembayaran",
      body: `Bukti pembayaran pesanan ${orderId} dari ${order.patientName} menunggu verifikasi.`,
      type: "payment",
      link: `/admin/pesanan/${orderId}`,
    });

    return proof;
  },

  /** Admin mengonfirmasi pembayaran */
  async confirm(orderId: string, actor: Session | null): Promise<void> {
    if (!can(actor, "admin.orders.write")) throw new PermissionError();
    const repos = getRepositories();
    const payment = await repos.payments.getByOrder(orderId);
    if (!payment) throw new Error("Data pembayaran tidak ditemukan.");

    await repos.payments.save({
      ...payment,
      status: "confirmed",
      rejectionReason: undefined,
      updatedAt: nowISO(),
    });
    await orderService.changeStatus(
      orderId,
      "payment_confirmed",
      actor,
      "Pembayaran diverifikasi admin"
    );
    await notificationService.notifyPatient({
      title: "Pembayaran dikonfirmasi",
      body: `Pembayaran pesanan ${orderId} telah diverifikasi. Pesanan Anda akan segera diproses.`,
      type: "payment",
      link: `/pesanan/${orderId}`,
    });
  },

  /** Admin menolak pembayaran — alasan WAJIB dan terlihat oleh pasien */
  async reject(orderId: string, actor: Session | null, reason: string): Promise<void> {
    if (!can(actor, "admin.orders.write")) throw new PermissionError();
    const trimmed = reason.trim();
    if (!trimmed) throw new Error("Alasan penolakan wajib diisi.");

    const repos = getRepositories();
    const payment = await repos.payments.getByOrder(orderId);
    if (!payment) throw new Error("Data pembayaran tidak ditemukan.");
    const order = await repos.orders.getById(orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");

    await repos.payments.save({
      ...payment,
      status: "rejected",
      rejectionReason: trimmed,
      updatedAt: nowISO(),
    });

    // pesanan kembali ke menunggu pembayaran agar pasien bisa unggah ulang
    const updatedOrder = {
      ...order,
      status: "pending_payment" as const,
      rejectionReason: trimmed,
      updatedAt: nowISO(),
      history: [
        ...order.history,
        {
          status: "pending_payment" as const,
          at: nowISO(),
          note: `Pembayaran ditolak: ${trimmed}`,
        },
      ],
    };
    await repos.orders.save(updatedOrder);

    await notificationService.notifyPatient({
      patientId: order.patientId,
      title: "Pembayaran ditolak",
      body: `Pembayaran pesanan ${orderId} ditolak. Alasan: ${trimmed}. Silakan unggah ulang bukti pembayaran.`,
      type: "payment",
      link: `/pembayaran/${orderId}`,
    });
  },
};
