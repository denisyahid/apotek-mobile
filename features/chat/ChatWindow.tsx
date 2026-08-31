"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Info, Plus, Send } from "lucide-react";
import { ProductBubble } from "@/features/chat/ProductBubble";
import { compressImageFile } from "@/lib/image";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { formatTimeID } from "@/lib/format";
import type { ChatMessage, Consultation, Role } from "@/types";

interface ChatWindowProps {
  viewerRole: Role;
  consultation: Consultation;
  messages: ChatMessage[];
  /** input terkait layar penuh chat — disediakan halaman */
  bottomAnchorRef?: RefObject<HTMLDivElement>;
  onSendText: (text: string) => Promise<void> | void;
  onSendImage: (image: { dataUrl: string; fileName: string; mimeType: string; size: number }) => Promise<void> | void;
}

/**
 * Area chat messaging modern:
 * - bubble kiri (lawan) / kanan (sendiri) — sesuai viewer
 * - auto-scroll ke pesan terbaru
 * - input sticky bawah, aman dari keyboard Android (dvh + safe-area)
 */
export function ChatWindow({
  viewerRole,
  consultation,
  messages,
  onSendText,
  onSendImage,
}: ChatWindowProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);

  // auto scroll saat pesan baru / pertama kali dibuka
  useEffect(() => {
    const firstOpen = lastCountRef.current === 0 && messages.length > 0;
    endRef.current?.scrollIntoView({ behavior: firstOpen ? "auto" : "smooth" });
    lastCountRef.current = messages.length;
  }, [messages.length]);

  const sendText = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await onSendText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return; // validasi ukuran ditangani toast di caller? keep simple
    try {
      const processed = await compressImageFile(file, 1000, 0.7);
      setSending(true);
      await onSendImage(processed);
    } catch {
      /* gambar tidak valid — abaikan */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Disclaimer keamanan konsultasi */}
      <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50/80 px-4 py-2.5">
        <Info size={14} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
        <p className="text-[11px] leading-relaxed text-amber-800">{MEDICAL_DISCLAIMER}</p>
      </div>

      {/* Daftar pesan */}
      <div
        id="chat-messages"
        role="log"
        aria-label="Pesan konsultasi"
        className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
      >
        <p className="mx-auto w-fit rounded-full bg-slate-200/70 px-3 py-1 text-[11px] font-semibold text-slate-500">
          Konsultasi: {consultation.subject}
        </p>
        {messages.map((msg, i) => (
          <MessageRow key={msg.id} message={msg} viewerRole={viewerRole} showDay={shouldShowDay(messages, i)} />
        ))}
        <div ref={endRef} aria-hidden />
      </div>

      {/* Input sticky — tidak tertutup keyboard (dvh layout) */}
      <div className="sticky bottom-0 z-10 border-t border-slate-100 bg-white/95 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Kirim foto (mis. foto resep atau kondisi)"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 transition-colors hover:bg-primary-100 active:bg-primary-200"
          >
            <Plus size={20} aria-hidden />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
            aria-label="Pilih gambar untuk dikirim"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            rows={1}
            placeholder="Tulis pesan…"
            aria-label="Tulis pesan"
            enterKeyHint="send"
            className="max-h-28 min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/25"
          />
          <button
            type="button"
            onClick={sendText}
            disabled={!text.trim() || sending}
            aria-label="Kirim pesan"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition-all hover:bg-primary-700 active:scale-95 disabled:bg-slate-300"
          >
            <Send size={18} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageRow({
  message,
  viewerRole,
  showDay,
}: {
  message: ChatMessage;
  viewerRole: Role;
  showDay: boolean;
}) {
  if (message.type === "system") {
    return (
      <>
        {showDay && <DayChip date={message.createdAt} />}
        <p className="mx-auto w-fit max-w-[85%] rounded-full bg-slate-100 px-3 py-1.5 text-center text-[11px] font-medium leading-relaxed text-slate-500">
          {message.text}
        </p>
      </>
    );
  }

  const own = message.sender === viewerRole;

  return (
    <>
      {showDay && <DayChip date={message.createdAt} />}
      <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[82%] ${own ? "items-end" : "items-start"} flex flex-col gap-1`}>
          {!own && (
            <span className="px-1 text-[10px] font-bold text-slate-400">{message.senderName}</span>
          )}

          {message.type === "product" && message.product ? (
            <ProductBubble product={message.product} viewerRole={viewerRole} />
          ) : message.type === "image" && message.imageDataUrl ? (
            <button
              type="button"
              onClick={() => window.open(message.imageDataUrl, "_blank", "noopener")}
              className="overflow-hidden rounded-2xl ring-1 ring-slate-900/10"
              aria-label="Lihat gambar"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageDataUrl}
                alt="Gambar dari percakapan"
                className="max-h-60 w-full max-w-[15.5rem] object-cover"
              />
            </button>
          ) : (
            <div
              className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                own
                  ? "rounded-br-md bg-primary-600 text-white"
                  : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-900/5"
              }`}
            >
              {message.text}
            </div>
          )}

          <span className={`px-1 text-[10px] text-slate-400 ${own ? "text-right" : ""}`}>
            {formatTimeID(message.createdAt)}
          </span>
        </div>
      </div>
    </>
  );
}

function DayChip({ date }: { date: string }) {
  const label = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
  return (
    <p className="mx-auto w-fit rounded-full bg-slate-200/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
      {label}
    </p>
  );
}

function shouldShowDay(messages: ChatMessage[], index: number): boolean {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].createdAt).toDateString();
  const curr = new Date(messages[index].createdAt).toDateString();
  return prev !== curr;
}
