import { StorageKeys, readJson, writeJson } from "@/lib/storage";
import {
  getSeedConsultations,
  getSeedMessages,
  getSeedOrders,
  getSeedPayments,
  getSeedProofs,
} from "@/repositories/json";
import type { ChatMessage, Consultation, Order, Payment, PaymentProof } from "@/types";

/**
 * Menyalin data seed JSON ke LocalStorage SEKALI saat aplikasi pertama dibuka.
 * Setelah itu LocalStorage menjadi sumber data mutable (order, pembayaran, chat).
 * Migrasi production: seed ini diganti baris data di Supabase PostgreSQL.
 */
export function ensureSeeded(): void {
  const seeded = readJson<string>(StorageKeys.seeded, "");
  if (seeded === "v1") return;

  if (readJson<Order[]>(StorageKeys.orders, []).length === 0) {
    writeJson(StorageKeys.orders, getSeedOrders());
  }
  if (readJson<Payment[]>(StorageKeys.payments, []).length === 0) {
    writeJson(StorageKeys.payments, getSeedPayments());
  }
  if (readJson<PaymentProof[]>(StorageKeys.paymentProofs, []).length === 0) {
    writeJson(StorageKeys.paymentProofs, getSeedProofs());
  }
  if (readJson<Consultation[]>(StorageKeys.consultations, []).length === 0) {
    writeJson(StorageKeys.consultations, getSeedConsultations());
  }
  if (Object.keys(readJson<Record<string, ChatMessage[]>>(StorageKeys.chatMessages, {})).length === 0) {
    writeJson(StorageKeys.chatMessages, getSeedMessages());
  }

  writeJson(StorageKeys.seeded, "v1");
}
