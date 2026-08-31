"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, ClipboardList, Wallet } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { formatDateID, formatIDR } from "@/lib/format";
import { ORDER_FILTERS, type OrderFilterId } from "@/lib/constants";
import { orderService } from "@/services/orderService";
import type { Order } from "@/types";

export default function OrdersPage() {
  const { session, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<OrderFilterId>("all");

  const load = useCallback(async () => {
    setError(false);
    try {
      const all = await orderService.listAll();
      const patientId = session?.userId ?? "guest";
      setOrders(all.filter((o) => o.patientId === patientId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const activeFilter = ORDER_FILTERS.find((f) => f.id === filter)!;
  const visible =
    activeFilter.statuses === null
      ? orders
      : orders.filter((o) => activeFilter.statuses!.includes(o.status));

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <h1 className="text-lg font-extrabold text-slate-800">Pesanan Saya</h1>

      {/* Filter tabs */}
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filter status pesanan">
        {ORDER_FILTERS.map((f) => {
          const active = f.id === filter;
          const count =
            f.statuses === null ? orders.length : orders.filter((o) => f.statuses!.includes(o.status)).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors ${
                active ? "bg-primary-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-slate-100"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {loading ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={36} aria-hidden />}
            title={
              orders.length === 0
                ? "Belum ada pesanan"
                : `Tidak ada pesanan "${activeFilter.label.toLowerCase()}"`
            }
            description={
              orders.length === 0
                ? "Pesanan yang Anda buat akan tampil di sini beserta statusnya."
                : "Coba ubah filter untuk melihat pesanan lain."
            }
            action={
              orders.length === 0 ? (
                <Link
                  href="/obat"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-bold text-white"
                >
                  Mulai Belanja
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/pesanan/${order.id}`}
                  className="block rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5 transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold tracking-tight text-slate-800">
                        {order.id}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDateID(order.createdAt)}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">
                      {order.items.length} Produk
                      {order.fulfillment === "pickup" ? " · Ambil di Tempat" : " · Diantar"}
                    </p>
                    <p className="text-base font-extrabold text-slate-800">
                      {formatIDR(order.total)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {order.status === "pending_payment" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        <Wallet size={13} aria-hidden /> Perlu Pembayaran
                      </span>
                    ) : (
                      <span className="flex -space-x-2" aria-hidden>
                        {order.items.slice(0, 3).map((it) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={it.productId}
                            src={it.image}
                            alt=""
                            className="h-8 w-8 rounded-lg object-cover ring-2 ring-white"
                          />
                        ))}
                        {order.items.length > 3 && (
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 ring-2 ring-white">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-primary-600">
                      Lihat Detail <ChevronRight size={14} aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && orders.length === 0 && (
        <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-xs leading-relaxed text-sky-800">
          <strong>Akun demo:</strong> masuk dengan <code>deni@sehatku.id</code> /{" "}
          <code>password123</code> untuk melihat contoh riwayat pesanan. Atau buat pesanan baru —
          datanya tersimpan di perangkat ini.
        </div>
      )}
    </div>
  );
}
