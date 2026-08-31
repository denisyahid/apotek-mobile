"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { ChatWindow } from "@/features/chat/ChatWindow";
import { Avatar } from "@/components/ui/Misc";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { DATA_CHANGED_EVENT, StorageKeys } from "@/lib/storage";
import { chatService } from "@/services/chatService";
import type { ChatMessage, Consultation } from "@/types";

/**
 * Chat konsultasi fullscreen (mobile).
 * Fixed inset-0 agar tidak terpengaruh padding layout & bottom nav.
 */
export default function PatientChatPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const found = await chatService.getConsultation(id);
      if (!found) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setConsultation(found);
      setMessages(await chatService.getMessages(id));
      await chatService.markRead(id, "patient");
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // update realtime saat admin membalas (tab lain / halaman admin)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (
        detail &&
        (detail.key === StorageKeys.chatMessages ||
          detail.key === StorageKeys.consultations ||
          detail.key === "*")
      ) {
        load();
      }
    };
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [load]);

  const sendText = async (text: string) => {
    await chatService.sendMessage(id, "patient", session?.name ?? "Pasien", { text });
    load();
  };

  const sendImage = async (image: { dataUrl: string; fileName: string; mimeType: string; size: number }) => {
    await chatService.sendMessage(id, "patient", session?.name ?? "Pasien", {
      imageDataUrl: image.dataUrl,
    });
    load();
  };

  return (
    <div className="fixed inset-0 z-30 flex h-[100dvh] flex-col bg-surface">
      {/* Header chat */}
      <header className="z-20 shrink-0 border-b border-slate-100 bg-white px-2 pt-safe shadow-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-2">
          <Link
            href="/konsultasi"
            aria-label="Kembali ke daftar konsultasi"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft size={22} aria-hidden />
          </Link>
          <Avatar name="Apoteker Andini" tone="teal" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">Apoteker Andini</p>
            <p className="flex items-center gap-1 text-[11px] text-green-600">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              Online · biasanya membalas &lt; 15 menit
            </p>
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold text-primary-700 min-[400px]:inline-flex">
            <ShieldCheck size={11} aria-hidden /> Apoteker Berlisensi
          </span>
        </div>
      </header>

      {/* Body */}
      {loading ? (
        <div className="flex-1 space-y-4 overflow-hidden p-4">
          <div className="h-10 w-3/5 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-primary-200/60" />
          <div className="h-24 w-48 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : notFound || !consultation ? (
        <EmptyState
          title="Konsultasi tidak ditemukan"
          description="Percakapan ini tidak tersedia di perangkat ini."
          action={
            <Link
              href="/konsultasi"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-bold text-white"
            >
              Kembali ke Konsultasi
            </Link>
          }
        />
      ) : (
        <div className="mx-auto w-full max-w-3xl flex-1 overflow-hidden">
          <ChatWindow
            viewerRole="patient"
            consultation={consultation}
            messages={messages}
            onSendText={sendText}
            onSendImage={sendImage}
          />
        </div>
      )}
    </div>
  );
}
