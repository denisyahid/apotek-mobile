"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, MessageCirclePlus, MessagesSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Misc";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { timeAgoID } from "@/lib/format";
import { chatService } from "@/services/chatService";
import type { ChatMessage, Consultation } from "@/types";

interface ConsultationWithPreview extends Consultation {
  preview?: string;
}

export default function ConsultationsPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<ConsultationWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const list = await chatService.listConsultations(session);
      const withPreview = await Promise.all(
        list.map(async (c) => {
          const messages = await chatService.getMessages(c.id);
          const last = messages[messages.length - 1];
          return { ...c, preview: previewOf(last) };
        })
      );
      setConsultations(withPreview);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const startConsultation = async () => {
    if (!subject.trim()) {
      toast("Tuliskan topik keluhan Anda", "warning");
      return;
    }
    setStarting(true);
    try {
      const consultation = await chatService.startConsultation({
        actor: session,
        subject,
        firstMessage,
      });
      toast("Konsultasi dibuat. Apoteker akan segera membalas.", "success");
      setSheetOpen(false);
      setSubject("");
      setFirstMessage("");
      router.push(`/konsultasi/${consultation.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal membuat konsultasi", "error");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-slate-800">Konsultasi</h1>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          <MessageCirclePlus size={16} aria-hidden /> Konsultasi
        </Button>
      </div>

      <div className="mt-3 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-4 text-white shadow-card">
        <p className="text-sm font-bold">Tanya apoteker, gratis ⚡</p>
        <p className="mt-1 text-xs leading-relaxed text-primary-50">
          Ceritakan keluhan Anda — apoteker kami akan membantu memilih produk yang sesuai.
        </p>
      </div>

      <div className="mt-4">
        {loading ? (
          <ListSkeleton rows={3} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : consultations.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare size={36} aria-hidden />}
            title="Belum ada konsultasi"
            description="Mulai percakapan dengan apoteker untuk mendapatkan rekomendasi obat yang tepat."
            action={
              <Button onClick={() => setSheetOpen(true)}>
                <MessageCirclePlus size={17} aria-hidden /> Mulai Konsultasi
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {consultations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/konsultasi/${c.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5 transition-shadow hover:shadow-lg"
                >
                  <Avatar name={c.patientName} tone={c.status === "closed" ? "slate" : "teal"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-800">{c.subject}</p>
                      {c.patientUnread > 0 && (
                        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {c.patientUnread}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {c.preview ?? "Belum ada pesan"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {c.patientName} · {timeAgoID(c.lastMessageAt)}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-slate-300" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-600/15">
        ⚠️ {MEDICAL_DISCLAIMER} Rekomendasi produk bersifat bantuan pemilihan, bukan diagnosis.
      </p>

      {/* Sheet mulai konsultasi */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Mulai Konsultasi"
        footer={
          <Button fullWidth loading={starting} onClick={startConsultation}>
            Mulai Chat dengan Apoteker
          </Button>
        }
      >
        <div className="space-y-4">
          <Input
            label="Topik / Keluhan"
            placeholder="cth: Demam anak 3 tahun"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            hint="Ringkas dalam beberapa kata"
            required
          />
          <Textarea
            label="Ceritakan Keluhan (opsional)"
            placeholder="cth: Anak saya demam sejak tadi malam, suhu 38°C…"
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            rows={4}
          />
          <p className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
            Anda juga bisa mengirim foto (mis. foto resep dokter atau kemasan obat) setelah chat
            dibuka. {MEDICAL_DISCLAIMER}
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}

function previewOf(message?: ChatMessage): string | undefined {
  if (!message) return undefined;
  if (message.type === "product") return `💊 Rekomendasi: ${message.product?.name ?? ""}`;
  if (message.type === "image") return "📷 Mengirim gambar";
  return message.text;
}
