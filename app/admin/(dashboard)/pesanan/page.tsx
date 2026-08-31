"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/StateViews";
import { formatDateID, formatIDR } from "@/lib/format";
import { ORDER_FILTERS, type OrderFilterId } from "@/lib/constants";
import { orderService } from "@/services/orderService";
import type { Order } from "@/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderFilterId>("all");

  const load = useCallback(async () => {
    setError(false);
    try {
      setOrders(await orderService.listAll());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeFilter = ORDER_FILTERS.find((f) => f.id === filter)!;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (activeFilter.statuses && !activeFilter.statuses.includes(o.status)) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.patientName.toLowerCase().includes(q) ||
        o.patientPhone.includes(q)
      );
    });
  }, [orders, query, activeFilter]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-lg font-extrabold text-slate-800">Pesanan</h1>
      <p className="text-xs text-slate-400">{orders.length} pesanan total</p>

      <div className="mt-4 space-y-2">
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor pesanan / nama pasien / no HP…"
            aria-label="Cari pesanan"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
          />
        </div>
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
          {ORDER_FILTERS.map((f) => {
            const active = f.id === filter;
            const count =
              f.statuses === null
                ? orders.length
                : orders.filter((o) => f.statuses!.includes(o.status)).length;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.id)}
                className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold ${
                  active ? "bg-primary-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
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
      </div>

      <div className="mt-4">
        {loading ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : visible.length === 0 ? (
          <EmptyState
            title="Tidak ada pesanan"
            description="Tidak ada pesanan yang cocok dengan pencarian atau filter ini."
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/pesanan/${o.id}`}
                  className="block rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-800">{o.id}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {o.patientName} · {o.patientPhone}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDateID(o.createdAt)} · {o.items.length} produk ·{" "}
                        {o.fulfillment === "pickup" ? "Ambil di tempat" : "Diantar"}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-100 pt-3">
                    <div>
                      <p className="text-base font-extrabold text-slate-800">{formatIDR(o.total)}</p>
                      <p className="text-[11px] text-slate-400">
                        Obat {formatIDR(o.subtotal)} + Kirim {formatIDR(o.shippingCost)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-primary-600">
                      Detail <ChevronRight size={14} aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
