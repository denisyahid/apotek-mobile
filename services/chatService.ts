import { PermissionError, can } from "@/lib/auth";
import { generateId, nowISO } from "@/lib/id";
import { getRepositories } from "@/repositories";
import { notificationService } from "@/services/notificationService";
import type {
  ChatMessage,
  Consultation,
  Product,
  RecommendedProduct,
  Role,
  Session,
} from "@/types";

/**
 * Konsultasi & chat.
 * CATATAN KEAMANAN: sistem TIDAK melakukan diagnosis medis otomatis —
 * rekomendasi obat hanya dikirim oleh apoteker (admin) melalui chat.
 */
export const chatService = {
  /** daftar konsultasi: pasien melihat miliknya, admin melihat semua */
  async listConsultations(viewer: Session | null): Promise<Consultation[]> {
    const all = await getRepositories().chat.getConsultations();
    if (viewer?.role === "admin") return all;
    const patientId = viewer?.userId ?? "guest";
    return all.filter((c) => c.patientId === patientId);
  },

  async getConsultation(id: string): Promise<Consultation | null> {
    return getRepositories().chat.getConsultation(id);
  },

  async getMessages(consultationId: string): Promise<ChatMessage[]> {
    return getRepositories().chat.getMessages(consultationId);
  },

  async startConsultation(input: {
    actor: Session | null;
    subject: string;
    firstMessage?: string;
  }): Promise<Consultation> {
    const repos = getRepositories();
    const patientId = input.actor?.userId ?? "guest";
    const patientName = input.actor?.name ?? "Pasien";
    const now = nowISO();

    const consultation: Consultation = {
      id: generateId("CST"),
      patientId,
      patientName,
      subject: input.subject.trim() || "Konsultasi umum",
      status: "open",
      createdAt: now,
      lastMessageAt: now,
      patientUnread: 0,
      adminUnread: 0,
    };
    await repos.chat.saveConsultation(consultation);

    await repos.chat.addMessage({
      id: generateId("MSG"),
      consultationId: consultation.id,
      sender: "system",
      senderName: "Sistem",
      type: "system",
      text: "Konsultasi dibuat. Mohon jelaskan keluhan Anda, apoteker akan membantu.",
      createdAt: now,
    });

    if (input.firstMessage?.trim()) {
      await this.sendMessage(consultation.id, "patient", patientName, {
        text: input.firstMessage.trim(),
      });
      // sendMessage sudah update unread; kembalikan ke 0 untuk pengirim
      await repos.chat.saveConsultation({ ...consultation, adminUnread: 1, patientUnread: 0 });
    }

    await notificationService.notifyAdmin({
      title: "Konsultasi baru",
      body: `${patientName} memulai konsultasi: ${consultation.subject}.`,
      type: "chat",
      link: `/admin/konsultasi/${consultation.id}`,
    });

    return consultation;
  },

  async sendMessage(
    consultationId: string,
    senderRole: Exclude<Role | "system", "system">,
    senderName: string,
    payload: { text?: string; imageDataUrl?: string }
  ): Promise<ChatMessage> {
    const repos = getRepositories();
    const consultation = await repos.chat.getConsultation(consultationId);
    if (!consultation) throw new Error("Konsultasi tidak ditemukan.");

    const message: ChatMessage = {
      id: generateId("MSG"),
      consultationId,
      sender: senderRole,
      senderName,
      type: payload.imageDataUrl ? "image" : "text",
      text: payload.text,
      imageDataUrl: payload.imageDataUrl,
      createdAt: nowISO(),
    };
    await repos.chat.addMessage(message);

    await repos.chat.saveConsultation({
      ...consultation,
      lastMessageAt: message.createdAt,
      patientUnread: senderRole === "admin" ? consultation.patientUnread + 1 : consultation.patientUnread,
      adminUnread: senderRole === "patient" ? consultation.adminUnread + 1 : consultation.adminUnread,
    });

    if (senderRole === "patient") {
      await notificationService.notifyAdmin({
        title: "Pesan baru",
        body: `${senderName}: ${payload.text?.slice(0, 60) ?? "mengirim gambar"}`,
        type: "chat",
        link: `/admin/konsultasi/${consultationId}`,
      });
    } else {
      await notificationService.notifyPatient({
        patientId: consultation.patientId,
        title: "Balasan apoteker",
        body: `${senderName}: ${payload.text?.slice(0, 60) ?? "mengirim gambar"}`,
        type: "chat",
        link: `/konsultasi/${consultationId}`,
      });
    }
    return message;
  },

  /** Admin merekomendasikan produk — SATU-SATUNYA sumber rekomendasi (bukan sistem otomatis) */
  async sendProductRecommendation(
    consultationId: string,
    actor: Session | null,
    product: Product
  ): Promise<ChatMessage> {
    if (!can(actor, "admin.chat.write")) throw new PermissionError();
    const repos = getRepositories();
    const consultation = await repos.chat.getConsultation(consultationId);
    if (!consultation) throw new Error("Konsultasi tidak ditemukan.");

    const snapshot: RecommendedProduct = {
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      requiresPrescription: product.requiresPrescription,
    };

    const message: ChatMessage = {
      id: generateId("MSG"),
      consultationId,
      sender: "admin",
      senderName: actor?.name ?? "Apoteker",
      type: "product",
      text: "Rekomendasi obat dari apoteker",
      product: snapshot,
      createdAt: nowISO(),
    };
    await repos.chat.addMessage(message);
    await repos.chat.saveConsultation({
      ...consultation,
      lastMessageAt: message.createdAt,
      patientUnread: consultation.patientUnread + 1,
    });

    await notificationService.notifyPatient({
      patientId: consultation.patientId,
      title: "Rekomendasi obat diterima",
      body: `Apoteker merekomendasikan ${product.name} untuk Anda.`,
      type: "recommendation",
      link: `/konsultasi/${consultationId}`,
    });
    return message;
  },

  async markRead(consultationId: string, viewerRole: Role): Promise<void> {
    const repos = getRepositories();
    const consultation = await repos.chat.getConsultation(consultationId);
    if (!consultation) return;
    await repos.chat.saveConsultation({
      ...consultation,
      patientUnread: viewerRole === "patient" ? 0 : consultation.patientUnread,
      adminUnread: viewerRole === "admin" ? 0 : consultation.adminUnread,
    });
  },
};
