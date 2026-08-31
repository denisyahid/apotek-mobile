"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock,
  QrCode,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/Misc";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { compressImageFile, type ProcessedImage } from "@/lib/image";
import { formatIDR } from "@/lib/format";
import { paymentService } from "@/services/paymentService";
import { orderService } from "@/services/orderService";
import type { Order, PaymentMethod } from "@/types";

/**
 * Halaman pembayaran.
 * PROTOTYPE: bukti pembayaran disimpan sebagai data URL di LocalStorage —
 * pada production, file diunggah ke Supabase Storage (PaymentProofRepository diganti).
 */
export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [proof, setProof] = useState<ProcessedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [found, methodList, payment] = await Promise.all([
        orderService.getById(orderId),
        paymentService.getMethods(),
        paymentService.getForOrder(orderId),
      ]);
      if (!found) {
        setNotFound(true);
        return;
      }
      setOrder(found);
      setMethods(methodList);
      if (payment) {
        const m = methodList.find((x) => x.id === payment.methodId);
        if (m) setSelectedMethod(m);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const pickFile = () => fileInputRef.current?.click();

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // agar file yang sama dapat dipilih ulang
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast("Ukuran gambar maksimal 8 MB", "error");
      return;
    }
    try {
      const processed = await compressImageFile(file);
      setProof(processed);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memproses gambar", "error");
    }
  };

  const selectMethod = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    try {
      await paymentService.selectMethod(orderId, method.id);
    } catch {
      /* pemilihan metode gagal disimpan — tetap bisa lanjut, admin akan melihat metode terakhir tersimpan */
    }
  };

  const submitProof = async () => {
    if (!proof || !selectedMethod) return;
    setSubmitting(true);
    try {
      await paymentService.submitProof(orderId, session, {
        dataUrl: proof.dataUrl,
        fileName: proof.fileName,
        mimeType: proof.mimeType,
        size: proof.size,
      });
      toast("Bukti pembayaran terkirim. Menunggu konfirmasi apoteker.", "success");
      router.replace(`/pesanan/${orderId}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengirim bukti", "error");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <EmptyState
          title="Pesanan tidak ditemukan"
          description="Nomor pesanan tidak valid atau sudah dihapus dari perangkat ini."
          action={
            <Link
              href="/pesanan"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-bold text-white"
            >
              Lihat Pesanan Saya
            </Link>
          }
        />
      </div>
    );
  }

  // pesanan sudah lewat tahap pembayaran
  if (order.status !== "pending_payment") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-slate-900/5">
          <CheckCircle2 size={48} className="mx-auto text-green-500" aria-hidden />
          <h1 className="mt-3 text-lg font-extrabold text-slate-800">
            Pembayaran pesanan ini sudah diproses
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Pesanan <span className="font-bold text-slate-700">{order.id}</span> sedang menunggu
            konfirmasi atau sudah dikonfirmasi apoteker.
          </p>
          <Link
            href={`/pesanan/${order.id}`}
            className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-bold text-white"
          >
            Lacak Pesanan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href={`/pesanan/${order.id}`}
          aria-label="Kembali"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-lg font-extrabold text-slate-800">Pembayaran</h1>
      </div>

      {/* Detail tagihan */}
      <section aria-label="Detail tagihan" className="mt-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nomor Pesanan</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-base font-extrabold tracking-tight text-slate-800">{order.id}</p>
          <CopyButton value={order.id} label="Salin" compact />
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-dashed border-slate-200 pt-3">
          <p className="text-sm text-slate-500">Total Pembayaran</p>
          <p className="text-2xl font-extrabold text-primary-700">{formatIDR(order.total)}</p>
        </div>
        <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          <Clock size={14} aria-hidden /> Selesaikan pembayaran, lalu unggah bukti di bawah.
          Pesanan diproses setelah apoteker memverifikasi.
        </p>
      </section>

      {/* Metode pembayaran */}
      <section aria-labelledby="metode-heading" className="mt-4">
        <h2 id="metode-heading" className="mb-3 text-sm font-bold text-slate-800">
          Pilih Metode Pembayaran
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {methods.map((m) => {
            const active = selectedMethod?.id === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMethod(m)}
                aria-pressed={active}
                className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold transition-colors ${
                  active
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-white text-slate-700 ring-1 ring-slate-900/5 hover:bg-slate-50"
                }`}
              >
                {m.type === "qris" ? (
                  <QrCode size={16} aria-hidden />
                ) : (
                  <Building2 size={16} aria-hidden />
                )}
                {m.type === "qris" ? "QRIS" : m.bankName}
              </button>
            );
          })}
        </div>

        {/* Detail metode terpilih */}
        {selectedMethod && (
          <div className="mt-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
            {selectedMethod.type === "bank_transfer" ? (
              <>
                <p className="text-xs font-semibold text-slate-400">
                  Transfer ke rekening berikut
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedMethod.bankName} · {selectedMethod.accountNumber}
                    </p>
                    <p className="text-xs text-slate-500">a.n. {selectedMethod.accountName}</p>
                  </div>
                  <CopyButton value={selectedMethod.accountNumber ?? ""} label="Salin No. Rekening" />
                </div>
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                  {selectedMethod.instructions} Transfer tepat{" "}
                  <strong className="text-slate-700">{formatIDR(order.total)}</strong> agar
                  verifikasi lebih cepat.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-400">
                  Scan QRIS dengan aplikasi apa pun
                </p>
                <div className="mt-3 flex flex-col items-center">
                  <Image
                    src={selectedMethod.qrImage ?? "/images/qr/qris-demo.svg"}
                    alt="Kode QRIS pembayaran"
                    width={220}
                    height={220}
                    className="rounded-2xl ring-1 ring-slate-200"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    a.n. {selectedMethod.accountName} (QR demo — prototype)
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Upload bukti pembayaran */}
      <section aria-labelledby="bukti-heading" className="mt-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <h2 id="bukti-heading" className="text-sm font-bold text-slate-800">
          Upload Bukti Pembayaran
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChosen}
          className="hidden"
          aria-label="Pilih foto bukti pembayaran"
        />

        {!proof ? (
          <button
            type="button"
            onClick={pickFile}
            className="mt-3 flex min-h-[44px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-slate-500 transition-colors hover:border-primary-400 hover:bg-primary-50/50 active:bg-primary-50"
          >
            <Upload size={26} className="text-primary-600" aria-hidden />
            <span className="text-sm font-bold text-slate-700">
              Ambil Foto / Pilih dari Galeri
            </span>
            <span className="text-xs">Format JPG/PNG, maks 8 MB</span>
          </button>
        ) : (
          <div className="mt-3">
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proof.dataUrl}
                alt="Pratinjau bukti pembayaran"
                className="max-h-72 w-full object-contain bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setProof(null)}
                aria-label="Hapus gambar bukti"
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur hover:bg-slate-900/80"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {proof.fileName} · {(proof.size / 1024).toFixed(0)} KB
            </p>
          </div>
        )}

        <Button
          size="lg"
          fullWidth
          className="mt-4"
          disabled={!proof || !selectedMethod}
          loading={submitting}
          onClick={submitProof}
        >
          <Upload size={18} aria-hidden /> Kirim Bukti Pembayaran
        </Button>
        {!selectedMethod && (
          <p className="mt-2 text-center text-xs font-medium text-amber-600">
            Pilih metode pembayaran terlebih dahulu
          </p>
        )}
        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
          Prototype: gambar tersimpan lokal di perangkat ini (LocalStorage). Pada production,
          bukti diunggah ke penyimpanan cloud apotek.
        </p>
      </section>
    </div>
  );
}
