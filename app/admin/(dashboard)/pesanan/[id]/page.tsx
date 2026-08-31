"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  Banknote,
  CheckCheck,
  ChevronLeft,
  MapPin,
  Store,
  Truck,
  TruckIcon,
} from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/StateViews";
import { CancelledNotice, OrderTimeline } from "@/features/orders/OrderTimeline";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ORDER_STATUS_META } from "@/lib/constants";
import { formatDateTimeID, formatIDR } from "@/lib/format";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import type { Order, OrderStatus, Payment, PaymentProof } from "@/types";

const NEXT_STATUS_OPTIONS: OrderStatus[] = [
  "processing",
  "ready_to_pickup",
  "shipping",
  "completed",
];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [proof, setProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [statusSheet, setStatusSheet] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus>("processing");
  const [statusNote, setStatusNote] = useState("");
  const [shippingOpen, setShippingOpen] = useState(false);
  const [shippingCost, setShippingCost] = useState("0");
  const [proofZoom, setProofZoom] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const found = await orderService.getById(id);
      if (!found) {
        setOrder(null);
        setLoading(false);
        return;
      }
      setOrder(found);
      setPayment(await paymentService.getForOrder(found.id));
      setProof(await paymentService.getProofForOrder(found.id));
      setShippingCost(String(found.shippingCost));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const guardError = (e: unknown) => {
    toast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
  };

  const confirmPayment = async () => {
    setBusy(true);
    try {
      await paymentService.confirm(order!.id, session);
      toast("Pembayaran dikonfirmasi", "success");
      load();
    } catch (e) {
      guardError(e);
    } finally {
      setBusy(false);
    }
  };

  const rejectPayment = async () => {
    if (!rejectReason.trim()) {
      toast("Alasan penolakan wajib diisi", "warning");
      return;
    }
    setBusy(true);
    try {
      await paymentService.reject(order!.id, session, rejectReason);
      toast("Pembayaran ditolak — pasien dapat mengunggah ulang", "info");
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch (e) {
      guardError(e);
    } finally {
      setBusy(false);
    }
  };

  const applyStatus = async () => {
    setBusy(true);
    try {
      await orderService.changeStatus(order!.id, nextStatus, session, statusNote || undefined);
      toast(`Status pesanan → ${ORDER_STATUS_META[nextStatus].label}`, "success");
      setStatusSheet(false);
      setStatusNote("");
      load();
    } catch (e) {
      guardError(e);
    } finally {
      setBusy(false);
    }
  };

  const saveShipping = async () => {
    const value = Number(shippingCost);
    if (Number.isNaN(value) || value < 0) {
      toast("Ongkos kirim tidak valid", "warning");
      return;
    }
    setBusy(true);
    try {
      await orderService.setShippingCost(order!.id, value, session);
      toast("Ongkos kirim diperbarui", "success");
      setShippingOpen(false);
      load();
    } catch (e) {
      guardError(e);
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    setBusy(true);
    try {
      await orderService.cancelByAdmin(order!.id, session, "Dibatalkan oleh apotek");
      toast("Pesanan dibatalkan", "info");
      load();
    } catch (e) {
      guardError(e);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (error) return <ErrorState onRetry={load} />;
  if (!order) {
    return (
      <EmptyState
        title="Pesanan tidak ditemukan"
        description="Pesanan ini tidak tersedia di perangkat ini."
        action={
          <Link
            href="/admin/pesanan"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-bold text-white"
          >
            Kembali
          </Link>
        }
      />
    );
  }

  const proofSrc = proof?.dataUrl ?? proof?.url;
  const canVerify = order.status === "waiting_confirmation" && payment?.status === "waiting_confirmation";
  const canEditShipping = ["pending_payment", "waiting_confirmation"].includes(order.status);
  const canCancel = !["completed", "cancelled"].includes(order.status);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/pesanan"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          aria-label="Kembali"
        >
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold text-slate-800">{order.id}</h1>
          <p className="text-xs text-slate-400">
            {order.patientName} · {order.patientPhone} · {formatDateTimeID(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Aksi utama */}
      <section aria-label="Aksi pesanan" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canVerify && (
            <>
              <Button variant="success" onClick={confirmPayment} loading={busy} className="flex-1">
                <CheckCheck size={17} aria-hidden /> Konfirmasi Pembayaran
              </Button>
              <Button variant="danger" onClick={() => setRejectOpen(true)} className="flex-1">
                <Ban size={17} aria-hidden /> Tolak Pembayaran
              </Button>
            </>
          )}
          {!["cancelled", "completed"].includes(order.status) && (
            <>
              <Button variant="outline" onClick={() => { setNextStatus(order.fulfillment === "pickup" ? "ready_to_pickup" : "shipping"); setStatusSheet(true); }} className="flex-1">
                <TruckIcon size={16} aria-hidden /> Ubah Status
              </Button>
              <Button variant="outline" onClick={() => setShippingOpen(true)} disabled={!canEditShipping} className="flex-1">
                <Banknote size={16} aria-hidden /> Atur Ongkir
              </Button>
              <Button variant="ghost" onClick={cancelOrder} disabled={!canCancel} className="text-red-600">
                Batalkan
              </Button>
            </>
          )}
        </div>
        {!canVerify && order.status === "waiting_confirmation" && (
          <p className="mt-2 text-xs text-slate-400">Menunggu bukti pembayaran diunggah pasien.</p>
        )}
      </section>

      {/* Pembayaran + bukti */}
      <section aria-label="Pembayaran" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-800">Pembayaran</h2>
          {payment && <PaymentStatusBadge status={payment.status} />}
        </div>
        {payment ? (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-slate-500">Metode</p>
              <p className="text-right font-semibold text-slate-800">{payment.methodName}</p>
              <p className="text-slate-500">Subtotal Obat</p>
              <p className="text-right font-semibold text-slate-800">{formatIDR(order.subtotal)}</p>
              <p className="text-slate-500">Ongkos Kirim</p>
              <p className="text-right font-semibold text-slate-800">{formatIDR(order.shippingCost)}</p>
              <p className="font-bold text-slate-700">Total</p>
              <p className="text-right font-extrabold text-primary-700">{formatIDR(order.total)}</p>
            </div>
            {payment.rejectionReason && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                Ditolak: {payment.rejectionReason}
              </p>
            )}
            {proofSrc ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-500">
                  Bukti Pembayaran ({proof?.fileName})
                </p>
                <button
                  type="button"
                  onClick={() => setProofZoom(true)}
                  className="block w-full overflow-hidden rounded-xl ring-1 ring-slate-200"
                  aria-label="Perbesar bukti pembayaran"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proofSrc} alt="Bukti pembayaran" className="max-h-56 w-full object-cover" />
                </button>
                <p className="mt-1 text-[11px] text-slate-400">
                  Diunggah {formatDateTimeID(proof!.uploadedAt)}
                </p>
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
                Pasien belum mengunggah bukti pembayaran.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">Pasien belum memilih metode pembayaran.</p>
        )}
      </section>

      {/* Items */}
      <section aria-label="Produk" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <h2 className="mb-2 text-sm font-bold text-slate-800">Produk ({order.items.length})</h2>
        <ul className="divide-y divide-slate-100">
          {order.items.map((it) => (
            <li key={it.productId} className="flex items-center gap-3 py-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                <Image src={it.image} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-slate-800">{it.name}</p>
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

      {/* Pengiriman */}
      <section aria-label="Pengiriman" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
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
        {order.address ? (
          <address className="not-italic text-xs leading-relaxed text-slate-500">
            <strong className="text-slate-700">{order.address.receiverName}</strong> ·{" "}
            {order.address.receiverPhone}
            <br />
            {order.address.street}, {order.address.district}, {order.address.city},{" "}
            {order.address.province} {order.address.postalCode}
            {order.address.note && (
              <>
                <br />
                <span className="text-slate-400">Catatan: {order.address.note}</span>
              </>
            )}
          </address>
        ) : (
          <p className="text-xs text-slate-500">
            Pasien mengambil langsung di apotek — tunjukkan nomor {order.id}.
          </p>
        )}
      </section>

      {/* Timeline */}
      <section aria-label="Riwayat" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <h2 className="mb-3 text-sm font-bold text-slate-800">Riwayat Status</h2>
        {order.status === "cancelled" ? <CancelledNotice order={order} /> : <OrderTimeline order={order} />}
        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
          {order.history.map((h, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
              <span className="font-semibold text-slate-500">
                {h.status === "created" ? "Pesanan dibuat" : ORDER_STATUS_META[h.status].label}
                {h.note && <span className="font-normal text-slate-400"> — {h.note}</span>}
              </span>
              <span className="shrink-0 text-slate-400">{formatDateTimeID(h.at)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Sheet tolak pembayaran */}
      <BottomSheet
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Tolak Pembayaran"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={() => setRejectOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" fullWidth loading={busy} onClick={rejectPayment}>
              Tolak dengan Alasan
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-slate-600">
            Alasan penolakan <strong className="text-red-600">wajib</strong> dan akan ditampilkan
            kepada pasien agar dapat mengunggah ulang bukti yang benar.
          </p>
          <Textarea
            label="Alasan Penolakan"
            placeholder="cth: Nominal transfer tidak sesuai total pesanan"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            required
          />
        </div>
      </BottomSheet>

      {/* Sheet ubah status */}
      <BottomSheet
        open={statusSheet}
        onClose={() => setStatusSheet(false)}
        title="Ubah Status Pesanan"
        footer={
          <Button fullWidth loading={busy} onClick={applyStatus}>
            Simpan Status
          </Button>
        }
      >
        <div className="space-y-4">
          <Select
            label="Status Baru"
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
          >
            {NEXT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_META[s].label}
              </option>
            ))}
          </Select>
          <Input
            label="Catatan (opsional)"
            placeholder="cth: Paket diserahkan ke kurir"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
          <p className="rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
            Pasien akan menerima notifikasi untuk setiap perubahan status.
          </p>
        </div>
      </BottomSheet>

      {/* Sheet ongkir */}
      <BottomSheet
        open={shippingOpen}
        onClose={() => setShippingOpen(false)}
        title="Atur Ongkos Kirim"
        footer={
          <Button fullWidth loading={busy} onClick={saveShipping}>
            Simpan Ongkos Kirim
          </Button>
        }
      >
        <div className="space-y-3">
          <Input
            label="Ongkos Kirim (Rp)"
            type="number"
            inputMode="numeric"
            min={0}
            value={shippingCost}
            onChange={(e) => setShippingCost(e.target.value)}
            hint={`Subtotal obat ${formatIDR(order.subtotal)} — total akan menjadi ${formatIDR(
              order.subtotal + (Number(shippingCost) || 0)
            )}`}
          />
          <p className="flex gap-1.5 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
            <MapPin size={13} className="mt-0.5 shrink-0" aria-hidden />
            Prototype: ongkir diatur manual admin. Production: dihitung otomatis dari API ekspedisi
            (lihat MIGRATION_TO_SUPABASE.md).
          </p>
        </div>
      </BottomSheet>

      {/* Zoom bukti */}
      {proofZoom && proofSrc && (
        <div
          role="dialog"
          aria-label="Bukti pembayaran"
          className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/80 p-4 animate-fade-in"
          onClick={() => setProofZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofSrc}
            alt="Bukti pembayaran"
            className="max-h-[85dvh] max-w-full rounded-2xl object-contain"
          />
          <button
            type="button"
            onClick={() => setProofZoom(false)}
            className="absolute right-4 top-4 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}
