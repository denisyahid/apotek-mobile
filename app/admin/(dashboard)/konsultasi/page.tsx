"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, MessagesSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Misc";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/StateViews";
import { timeAgoID } from "@/lib/format";
import { chatService } from "@/services/chatService";
import type { ChatMessage, Consultation } from "@/types";

interface Row extends Consultation {
  preview?: string;
}

export default function AdminConsultationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const list = await chatService.listConsultations({
        userId: "",
        role: "admin",
        name: "Admin",
        email: "",
        loggedAt: "",
      });
      const withPreview = await Promise.all(
        list.map(async (c) => {
          const messages: ChatMessage[] = await chatService.getMessages(c.id);
          const last = messages[messages.length - 1];
          return {
            ...c,
            preview: last?.type === "product"
              ? `💊 Rekomendasi: ${last.product?.name ?? ""}`
              : last?.type === "image"
                ? "📷 Gambar"
                : (last?.text ?? "Belum ada pesan"),
          };
        })
      );
      // urutkan: belum dibaca dulu, lalu pesan terbaru
      withPreview.sort((a, b) => {
        if (a.adminUnread !== b.adminUnread) return b.adminUnread - a.adminUnread;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
      setRows(withPreview);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-extrabold text-slate-800">Konsultasi</h1>
      <p className="text-xs text-slate-400">
        {rows.filter((r) => r.adminUnread > 0).length} percakapan menunggu balasan
      </p>

      <div className="mt-4">
        {loading ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare size={36} aria-hidden />}
            title="Belum ada konsultasi"
            description="Percakapan pasien akan muncul di sini untuk Anda balas."
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/konsultasi/${c.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5 hover:shadow-lg"
                >
                  <Avatar name={c.patientName} tone={c.adminUnread > 0 ? "amber" : "teal"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-800">{c.patientName}</p>
                      {c.status === "closed" && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          Selesai
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{c.preview}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {c.subject} · {timeAgoID(c.lastMessageAt)}
                    </p>
                  </div>
                  {c.adminUnread > 0 ? (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {c.adminUnread}
                    </span>
                  ) : (
                    <ChevronRight size={18} className="shrink-0 text-slate-300" aria-hidden />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
