"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  MapPin,
  MessageCircle,
  Store,
  Trash2,
  TriangleAlert,
  Truck,
  Wallet,
} from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/Misc";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/StateViews";
import { CancelledNotice, OrderTimeline } from "@/features/orders/OrderTimeline";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ORDER_STATUS_META } from "@/lib/constants";
import { formatDateID, formatDateTimeID, formatIDR } from "@/lib/format";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import type { Order, Payment, PaymentProof } from "@/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { session } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [proof, setProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const found = await orderService.getById(id);
      if (!found) {
        setError(false);
        setOrder(null);
        setLoading(false);
        return;
      }
      setOrder(found);
      setPayment(await paymentService.getForOrder(found.id));
      setProof(await paymentService.getProofForOrder(found.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const cancelOrder = async () => {
    try {
      await orderService.cancelByPatient(order!.id, session);
      toast("Pesanan dibatalkan", "success");
      setConfirmCancel(false);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal membatalkan", "error");
    }
  };

  const completeOrder = async () => {
    try {
      await orderService.completeByPatient(order!.id, session);
      toast("Terima kasih! Pesanan ditandai selesai", "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menandai selesai", "error");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) return <div className="mx-auto max-w-2xl px-4 py-4"><ErrorState onRetry={load} /></div>;

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <EmptyState
          title="Pesanan tidak ditemukan"
          description="Pesanan ini tidak ada di perangkat ini atau nomor tidak valid."
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

  const statusMeta = ORDER_STATUS_META[order.status];
  const canPay = order.status === "pending_payment";
  const canCancel = order.status === "pending_payment";
  const canComplete = ["ready_to_pickup", "shipping"].includes(order.status);
  const proofSrc = proof?.dataUrl ?? proof?.url;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          href="/pesanan"
          aria-label="Kembali ke daftar pesanan"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-lg font-extrabold text-slate-800">Detail Pesanan</h1>
      </div>

      {/* Status */}
      <section
        aria-label="Status pesanan"
        className="mt-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {order.id}
            </p>
            <p className="mt-0.5 text-base font-extrabold text-slate-800">{statusMeta.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{statusMeta.description}</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Dibuat {formatDateTimeID(order.createdAt)} · Diperbarui{" "}
              {formatDateTimeID(order.updatedAt)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Alasan penolakan pembayaran — WAJIB terlihat pasien */}
        {order.rejectionReason && canPay && (
          <div role="alert" className="mt-3 flex gap-2.5 rounded-2xl bg-red-50 p-3.5 ring-1 ring-inset ring-red-600/20">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-red-500" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">Pembayaran ditolak apoteker</p>
              <p className="mt-0.5 text-xs leading-relaxed text-red-600">
                Alasan: {order.rejectionReason}
              </p>
              <Button
                size="sm"
                variant="danger"
                className="mt-2"
                onClick={() => router.push(`/pembayaran/${order.id}`)}
              >
                <Wallet size={15} aria-hidden /> Unggah Ulang Bukti
              </Button>
            </div>
          </div>
        )}

        <div className="mt-3">
          {canPay && !order.rejectionReason && (
            <Button fullWidth onClick={() => router.push(`/pembayaran/${order.id}`)}>
              <Wallet size={17} aria-hidden /> Bayar Sekarang · {formatIDR(order.total)}
            </Button>
          )}
          {canComplete && (
            <Button variant="success" fullWidth onClick={completeOrder}>
              Konfirmasi Pesanan Diterima
            </Button>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section aria-label="Riwayat status" className="mt-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        {order.status === "cancelled" ? <CancelledNotice order={order} /> : <OrderTimeline order={order} />}
      </section>

      {/* Produk */}
      <section aria-label="Produk dipesan" className="mt-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <h2 className="mb-2 text-sm font-bold text-slate-800">Produk ({order.items.length})</h2>
        <ul className="divide-y divide-slate-100">
          {order.items.map((it) => (
            <li key={it.productId} className="flex items-center gap-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                <Image src={it.image} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/obat/${it.productId}`} className="line-clamp-2 text-sm font-semibold text-slate-800">
                  {it.name}
                </Link>
                <p className="text-xs text-slate-400">
                  {it.qty} × {formatIDR(it.price)}
                  {it.requiresPrescription && (
                    <span className="ml-1 font-bold text-amber-600">· butuh resep</span>
                  )}
                </p>
              </div>
              <p className="text-sm font-bold text-slate-800">{formatIDR(it.price * it.qty)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Pengambilan / pengiriman */}
      <section aria-label="Informasi pengambilan" className="mt-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
          {order.fulfillment === "pickup" ? (
            <>
              <Store size={15} className="text-primary-600" aria-hidden /> Ambil di Tempat
            </>
          ) : (
            <>
              <Truck size={15} className="text-primary-600" aria-hidden /> Diantar ke Alamat
            </>
          )}
        </h2>
        {order.fulfillment === "pickup" ? (
          <p className="text-xs leading-relaxed text-slate-500">
            Tunjukkan nomor pesanan <strong className="text-slate-700">{order.id}</strong> kepada
            petugas apotek.{" "}
            {order.address === undefined ? "Jam operasional tercantum pada halaman lokasi di beranda." : ""}
          </p>
        ) : (
          order.address && (
            <address className="not-italic text-xs leading-relaxed text-slate-500">
              <strong className="text-slate-700">{order.address.receiverName}</strong> ·{" "}
              {order.address.receiverPhone}
              <br />
              {order.address.street}, {order.address.district}
              <br />
              {order.address.city}, {order.address.province} {order.address.postalCode}
              {order.address.note && (
                <>
                  <br />
                  <span className="text-slate-400">Catatan: {order.address.note}</span>
                </>
              )}
            </address>
          )
        )}
      </section>

      {/* Pembayaran */}
      <section aria-label="Informasi pembayaran" className="mt-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
          <MapPin size={15} className="text-primary-600" aria-hidden /> Pembayaran
        </h2>
        {payment ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Metode</span>
              <span className="font-semibold text-slate-800">{payment.methodName}</span>
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal Obat</dt>
                <dd className="font-semibold text-slate-800">{formatIDR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Ongkos Kirim</dt>
                <dd className="font-semibold text-slate-800">
                  {order.shippingCost === 0 ? "Gratis" : formatIDR(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5">
                <dt className="font-bold text-slate-800">Total</dt>
                <dd className="font-extrabold text-primary-700">{formatIDR(order.total)}</dd>
              </div>
            </dl>
            {proofSrc && (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-500">Bukti Pembayaran</p>
                <button
                  type="button"
                  onClick={() => window.open(proofSrc, "_blank", "noopener")}
                  className="block overflow-hidden rounded-xl ring-1 ring-slate-200"
                  aria-label="Lihat bukti pembayaran lebih besar"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proofSrc} alt="Bukti pembayaran" className="max-h-44 w-full object-cover" />
                </button>
                <p className="mt-1 text-[11px] text-slate-400">
                  Diunggah {formatDateTimeID(proof!.uploadedAt)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Belum memilih metode pembayaran.</p>
        )}
      </section>

      {/* Aksi lain */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          href="/konsultasi"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-primary-700 ring-1 ring-primary-600/25"
        >
          <MessageCircle size={17} aria-hidden /> Tanya Apoteker
        </Link>
        <div className="flex items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-slate-900/5">
          <span className="truncate text-xs font-semibold text-slate-500">{order.id}</span>
          <CopyButton value={order.id} label="Salin" compact />
        </div>
      </div>

      {canCancel && (
        <div className="mt-3 text-center">
          {confirmCancel ? (
            <div role="alertdialog" aria-label="Konfirmasi pembatalan" className="rounded-2xl bg-red-50 p-4 ring-1 ring-inset ring-red-600/20">
              <p className="text-sm font-bold text-red-700">Batalkan pesanan ini?</p>
              <p className="mt-1 text-xs text-red-600">
                Stok produk akan dikembalikan dan pesanan tidak dapat dilanjutkan.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" fullWidth onClick={() => setConfirmCancel(false)}>
                  Tidak
                </Button>
                <Button variant="danger" fullWidth onClick={cancelOrder}>
                  <Trash2 size={16} aria-hidden /> Ya, Batalkan
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="min-h-[44px] px-4 text-sm font-bold text-red-500 hover:text-red-600"
            >
              Batalkan Pesanan
            </button>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-slate-400">
        Pesanan dibuat {formatDateID(order.createdAt)} · Pasien: {order.patientName}
      </p>
    </div>
  );
}
