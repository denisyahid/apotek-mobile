import { readJson, writeJson, StorageKeys } from "@/lib/storage";
import { ensureSeeded } from "@/repositories/local/seed";
import type { ChatRepository } from "@/repositories/types";
import type { ChatMessage, Consultation } from "@/types";

/**
 * Konsultasi & pesan chat — LocalStorage.
 * Production: tabel `consultations` + `messages` + Supabase Realtime
 * untuk sinkronisasi langsung antar perangkat.
 */
export class LocalChatRepository implements ChatRepository {
  constructor() {
    ensureSeeded();
  }

  private consultations(): Consultation[] {
    return readJson<Consultation[]>(StorageKeys.consultations, []);
  }

  private messagesMap(): Record<string, ChatMessage[]> {
    return readJson<Record<string, ChatMessage[]>>(StorageKeys.chatMessages, {});
  }

  async getConsultations(): Promise<Consultation[]> {
    return this.consultations().sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  async getConsultation(id: string): Promise<Consultation | null> {
    return this.consultations().find((c) => c.id === id) ?? null;
  }

  async saveConsultation(consultation: Consultation): Promise<Consultation> {
    const list = this.consultations();
    const idx = list.findIndex((c) => c.id === consultation.id);
    if (idx >= 0) list[idx] = consultation;
    else list.push(consultation);
    writeJson(StorageKeys.consultations, list);
    return consultation;
  }

  async getMessages(consultationId: string): Promise<ChatMessage[]> {
    const messages = this.messagesMap()[consultationId] ?? [];
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async addMessage(message: ChatMessage): Promise<ChatMessage> {
    const map = this.messagesMap();
    const list = map[message.consultationId] ?? [];
    list.push(message);
    map[message.consultationId] = list;
    writeJson(StorageKeys.chatMessages, map);
    return message;
  }
}
