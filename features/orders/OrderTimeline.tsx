"use client";

import {
  Check,
  ClipboardCheck,
  Package,
  PackageCheck,
  Store,
  Truck,
  Undo2,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Order } from "@/types";

/** jumlah langkah yang selesai untuk tiap status */
const COMPLETED_STEPS: Record<string, number> = {
  pending_payment: 1,
  waiting_confirmation: 2,
  payment_confirmed: 3,
  processing: 4,
  ready_to_pickup: 5,
  shipping: 5,
  completed: 6,
};

/** Timeline status pesanan (vertikal, mobile-friendly) */
export function OrderTimeline({ order }: { order: Order }) {
  const completedCount = COMPLETED_STEPS[order.status] ?? 1;

  const steps: { label: string; description: string; icon: LucideIcon; at?: string }[] = [
    {
      label: "Pesanan Dibuat",
      description: "Pesanan Anda berhasil dibuat",
      icon: ClipboardCheck,
      at: order.createdAt,
    },
    {
      label: "Pembayaran Diupload",
      description: "Bukti pembayaran diterima",
      icon: Wallet,
      at: findEvent(order, "waiting_confirmation"),
    },
    {
      label: "Pembayaran Dikonfirmasi",
      description: "Apoteker memverifikasi pembayaran",
      icon: PackageCheck,
      at: findEvent(order, "payment_confirmed"),
    },
    {
      label: "Pesanan Diproses",
      description: "Obat disiapkan oleh apoteker",
      icon: Package,
      at: findEvent(order, "processing"),
    },
    {
      label: order.fulfillment === "pickup" ? "Siap Diambil" : "Sedang Dikirim",
      description:
        order.fulfillment === "pickup"
          ? "Ambil sesuai jam operasional apotek"
          : "Paket dalam perjalanan ke alamat Anda",
      icon: order.fulfillment === "pickup" ? Store : Truck,
      at: findEvent(order, order.fulfillment === "pickup" ? "ready_to_pickup" : "shipping"),
    },
    {
      label: "Selesai",
      description: order.fulfillment === "pickup" ? "Obat telah diambil" : "Paket diterima",
      icon: Check,
      at: findEvent(order, "completed"),
    },
  ];

  return (
    <ol aria-label="Status pesanan">
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const done = stepNumber <= completedCount;
        const isCurrent = !done && stepNumber === completedCount + 1;

        return (
          <li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 rounded ${
                  done ? "bg-primary-500" : "bg-slate-200"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                done
                  ? "bg-primary-600 text-white"
                  : isCurrent
                    ? "bg-white text-primary-600 ring-2 ring-primary-500"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <Check size={16} /> : <step.icon size={16} />}
              {isCurrent && (
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary-400/40" />
              )}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p
                className={`text-sm font-bold ${
                  done || isCurrent ? "text-slate-800" : "text-slate-400"
                }`}
              >
                {step.label}
                {isCurrent && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 ring-1 ring-inset ring-sky-600/20">
                    Sedang berjalan
                  </span>
                )}
              </p>
              <p
                className={`text-xs leading-relaxed ${
                  done || isCurrent ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {step.description}
              </p>
              {done && step.at && (
                <p className="mt-0.5 text-[11px] text-slate-400">{formatAt(step.at)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Tampilan khusus pesanan dibatalkan */
export function CancelledNotice({ order }: { order: Order }) {
  const cancelEvent = [...order.history].reverse().find((h) => h.status === "cancelled");
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-inset ring-red-600/20"
    >
      <Undo2 size={20} className="shrink-0 text-red-500" aria-hidden />
      <div>
        <p className="text-sm font-bold text-red-700">Pesanan Dibatalkan</p>
        <p className="mt-0.5 text-xs leading-relaxed text-red-600">
          {cancelEvent?.note ?? "Pesanan telah dibatalkan."}
        </p>
        {cancelEvent && (
          <p className="mt-1 text-[11px] text-red-400">{formatAt(cancelEvent.at)}</p>
        )}
      </div>
    </div>
  );
}

function findEvent(order: Order, status: string): string | undefined {
  const events = order.history.filter((h) => h.status === status);
  return events.length > 0 ? events[events.length - 1].at : undefined;
}

function formatAt(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
