"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Phone, Pill, UserRound } from "lucide-react";
import { ChatWindow } from "@/features/chat/ChatWindow";
import { RecommendProductSheet } from "@/features/admin/RecommendProductSheet";
import { Avatar } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { DATA_CHANGED_EVENT, StorageKeys } from "@/lib/storage";
import { chatService } from "@/services/chatService";
import { useToast } from "@/hooks/useToast";
import type { ChatMessage, Consultation } from "@/types";

export default function AdminChatPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const { toast } = useToast();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recommendOpen, setRecommendOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const found = await chatService.getConsultation(id);
      if (!found) {
        setConsultation(null);
        setLoading(false);
        return;
      }
      setConsultation(found);
      setMessages(await chatService.getMessages(id));
      await chatService.markRead(id, "admin");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // realtime antar halaman (tab admin ↔ pasien pada prototipe satu perangkat)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (
        detail &&
        (detail.key === StorageKeys.chatMessages || detail.key === StorageKeys.consultations || detail.key === "*")
      ) {
        load();
      }
    };
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [load]);

  const sendText = async (text: string) => {
    await chatService.sendMessage(id, "admin", session?.name ?? "Apoteker", { text });
    load();
  };

  const sendImage = async (image: { dataUrl: string }) => {
    await chatService.sendMessage(id, "admin", session?.name ?? "Apoteker", {
      imageDataUrl: image.dataUrl,
    });
    load();
  };

  const sendRecommendation = async (product: Parameters<typeof chatService.sendProductRecommendation>[2]) => {
    try {
      await chatService.sendProductRecommendation(id, session, product);
      toast(`Rekomendasi ${product.name} terkirim`, "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal mengirim rekomendasi", "error");
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col lg:h-[calc(100dvh-6.5rem)]">
      {/* Header chat */}
      <header className="flex shrink-0 items-center gap-2 rounded-2xl bg-white px-2 py-2 shadow-card ring-1 ring-slate-900/5">
        <Link
          href="/admin/konsultasi"
          aria-label="Kembali ke daftar konsultasi"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <Avatar name={consultation?.patientName ?? "Pasien"} tone="slate" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800">
            {consultation?.patientName ?? "Pasien"}
          </p>
          <p className="truncate text-[11px] text-slate-400">{consultation?.subject}</p>
        </div>
        <span className="hidden items-center gap-1 text-[11px] text-slate-400 min-[420px]:flex">
          <UserRound size={12} aria-hidden /> {consultation?.patientId === "guest" ? "Tanpa akun" : "Pasien terdaftar"}
        </span>
      </header>

      {/* Aksi rekomendasi */}
      <div className="mt-2 shrink-0">
        <Button fullWidth onClick={() => setRecommendOpen(true)} variant="secondary">
          <Pill size={17} aria-hidden /> Rekomendasikan Obat
        </Button>
      </div>

      {/* Chat */}
      <div className="mt-2 min-h-0 flex-1 overflow-hidden rounded-2xl">
        {loading ? (
          <div className="space-y-4 p-4">
            <div className="h-10 w-3/5 animate-pulse rounded-2xl bg-slate-200/70" />
            <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-primary-200/60" />
            <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-slate-200/70" />
          </div>
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : !consultation ? (
          <EmptyState
            title="Konsultasi tidak ditemukan"
            description="Percakapan ini tidak tersedia di perangkat ini."
            action={
              <Link
                href="/admin/konsultasi"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-bold text-white"
              >
                Kembali
              </Link>
            }
          />
        ) : (
          <ChatWindow
            viewerRole="admin"
            consultation={consultation}
            messages={messages}
            onSendText={sendText}
            onSendImage={sendImage}
          />
        )}
      </div>

      <RecommendProductSheet
        open={recommendOpen}
        onClose={() => setRecommendOpen(false)}
        onSend={sendRecommendation}
      />
    </div>
  );
}
