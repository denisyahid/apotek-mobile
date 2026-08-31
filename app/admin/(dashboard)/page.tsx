"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  ChevronRight,
  ClipboardList,
  Clock3,
  MessagesSquare,
  PackageSearch,
  ShoppingBag,
  UserRound,
  Users,
} from "lucide-react";
import { MiniBarChart, StatCard, formatIDRShort } from "@/features/admin/DashboardWidgets";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { ErrorState, Skeleton } from "@/components/ui/StateViews";
import { formatIDR, timeAgoID } from "@/lib/format";
import { getRepositories } from "@/repositories";
import { chatService } from "@/services/chatService";
import { orderService } from "@/services/orderService";
import type { Consultation, Order, StoredUser } from "@/types";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [orderList, userList, consultList] = await Promise.all([
        orderService.listAll(),
        getRepositories().users.getAll(),
        chatService.listConsultations({ role: "admin", userId: "", name: "admin", email: "", loggedAt: "" }),
      ]);
      setOrders(orderList);
      setUsers(userList);
      setConsultations(consultList);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const revenue = orders
      .filter((o) =>
        ["payment_confirmed", "processing", "ready_to_pickup", "shipping", "completed"].includes(
          o.status
        )
      )
      .reduce((sum, o) => sum + o.total, 0);
    return {
      totalOrders: orders.length,
      newOrders: orders.filter((o) => o.status === "pending_payment").length,
      waitingConfirmation: orders.filter((o) => o.status === "waiting_confirmation").length,
      revenue,
      patients: users.filter((u) => u.role === "patient").length,
      activeConsultations: consultations.filter((c) => c.status === "open").length,
    };
  }, [orders, users, consultations]);

  /** data 7 hari terakhir */
  const chartData = useMemo(() => {
    const days: { label: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayOrders = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      });
      days.push({
        label: DAY_LABELS[d.getDay()],
        orders: dayOrders.length,
        revenue: dayOrders
          .filter((o) => o.status !== "cancelled" && o.status !== "pending_payment")
          .reduce((sum, o) => sum + o.total, 0),
      });
    }
    return days;
  }, [orders]);

  const recentOrders = orders.slice(0, 5);
  const recentConsultations = consultations.filter((c) => c.adminUnread > 0 || c.status === "open").slice(0, 4);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-8 w-52" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-lg font-extrabold text-slate-800">Dashboard Admin</h1>
        <p className="text-xs text-slate-400">Ringkasan operasional apotek hari ini</p>
      </div>

      {/* Stat cards — 2 kolom mobile */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total Pesanan" value={String(stats.totalOrders)} icon={ClipboardList} tone="teal" />
        <StatCard label="Pesanan Baru" value={String(stats.newOrders)} icon={ShoppingBag} tone="amber" hint="Menunggu pembayaran" />
        <StatCard
          label="Menunggu Konfirmasi"
          value={String(stats.waitingConfirmation)}
          icon={Clock3}
          tone="sky"
          hint="Bukti bayar perlu dicek"
        />
        <StatCard label="Total Pendapatan" value={formatIDR(stats.revenue)} icon={Banknote} tone="green" hint="Pesanan terkonfirmasi" />
        <StatCard label="Total Pasien" value={String(stats.patients)} icon={Users} tone="violet" />
        <StatCard
          label="Konsultasi Aktif"
          value={String(stats.activeConsultations)}
          icon={MessagesSquare}
          tone="teal"
          hint={`${consultations.filter((c) => c.adminUnread > 0).length} belum dibalas`}
        />
      </div>

      {/* Grafik */}
      <div className="grid gap-3 lg:grid-cols-2">
        <MiniBarChart
          label="Pesanan 7 Hari Terakhir"
          data={chartData.map((d) => ({ label: d.label, value: d.orders }))}
        />
        <MiniBarChart
          label="Pendapatan 7 Hari Terakhir"
          data={chartData.map((d) => ({ label: d.label, value: d.revenue }))}
          valueFormatter={formatIDRShort}
          color="bg-green-500"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Pesanan terbaru */}
        <section aria-label="Pesanan terbaru" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Pesanan Terbaru</h2>
            <Link href="/admin/pesanan" className="flex min-h-[44px] items-center gap-0.5 text-xs font-bold text-primary-600">
              Semua <ChevronRight size={14} aria-hidden />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">Belum ada pesanan.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/pesanan/${o.id}`}
                    className="flex min-h-[56px] items-center gap-3 py-2.5 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-slate-700">{o.id}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {o.patientName} · {timeAgoID(o.createdAt)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-slate-800">{formatIDR(o.total)}</p>
                    <OrderStatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Konsultasi */}
        <section aria-label="Konsultasi terbaru" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Konsultasi Perlu Perhatian</h2>
            <Link href="/admin/konsultasi" className="flex min-h-[44px] items-center gap-0.5 text-xs font-bold text-primary-600">
              Semua <ChevronRight size={14} aria-hidden />
            </Link>
          </div>
          {recentConsultations.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">Tidak ada konsultasi aktif.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentConsultations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/konsultasi/${c.id}`}
                    className="flex min-h-[56px] items-center gap-3 py-2.5 hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-extrabold text-primary-700">
                      {c.patientName.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-slate-700">{c.subject}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {c.patientName} · {timeAgoID(c.lastMessageAt)}
                      </p>
                    </div>
                    {c.adminUnread > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {c.adminUnread}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Shortcut */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <Link
          href="/admin/produk"
          className="flex min-h-[72px] items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5"
        >
          <PackageSearch size={20} className="text-primary-600" aria-hidden />
          <span className="text-sm font-bold text-slate-700">Kelola Produk</span>
          <ArrowRight size={15} className="ml-auto text-slate-300" aria-hidden />
        </Link>
        <Link
          href="/admin/pengaturan"
          className="flex min-h-[72px] items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5"
        >
          <UserRound size={20} className="text-primary-600" aria-hidden />
          <span className="text-sm font-bold text-slate-700">Pengaturan</span>
          <ArrowRight size={15} className="ml-auto text-slate-300" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
