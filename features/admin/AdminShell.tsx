"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Package,
  Pill,
  ReceiptText,
  Settings,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/useToast";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produk", label: "Produk", icon: Package },
  { href: "/admin/pesanan", label: "Pesanan", icon: ShoppingCart },
  { href: "/admin/konsultasi", label: "Konsultasi", icon: MessagesSquare },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

/**
 * Shell admin: sidebar permanen di desktop, drawer + hamburger di mobile.
 * Guard: hanya role admin — UI TIDAK menjadi satu-satunya proteksi
 * (service layer juga memvalidasi izin; production: kebijakan server/RLS).
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { session, loading, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // guard otorisasi
  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/admin/login");
    } else if (session.role !== "admin") {
      toast("Akses ditolak — khusus admin.", "error");
      router.replace("/");
    }
  }, [session, loading, router, toast]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    toast("Anda telah keluar", "info");
    router.replace("/admin/login");
  };

  const isSubPage = /^\/admin\/(pesanan|konsultasi)\/[^/]+/.test(pathname);

  const navList = (
    <ul className="space-y-1">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[52px] items-center gap-3 rounded-xl px-4 text-sm font-bold transition-colors ${
                active
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <item.icon size={19} aria-hidden />
              {item.label}
              {item.href === "/admin/konsultasi" && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (loading || !session || session.role !== "admin") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Pill size={32} className="animate-pulse text-primary-500" aria-hidden />
          <p className="text-sm font-semibold">Memeriksa akses admin…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface lg:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Pill size={17} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-800">Admin Sehatku</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Panel Apoteker
            </p>
          </div>
        </div>
        <nav aria-label="Navigasi admin" className="flex-1 p-3">
          {navList}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <Link
            href="/"
            className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            <Store size={18} aria-hidden /> Lihat Toko
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} aria-hidden /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile + desktop */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-slate-200 bg-white px-3 lg:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu admin"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Settings size={0} className="hidden" aria-hidden />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          {isSubPage ? (
            <Link
              href={pathname.split("/").slice(0, 3).join("/")}
              className="flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft size={18} aria-hidden /> Kembali
            </Link>
          ) : (
            <p className="truncate text-base font-extrabold text-slate-800">
              {NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)))?.label ?? "Admin"}
            </p>
          )}

          <div className="flex-1" />

          <Link
            href="/admin"
            className="hidden min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 sm:flex lg:hidden"
          >
            <LayoutDashboard size={17} aria-hidden /> Dashboard
          </Link>
          <button
            type="button"
            onClick={() => router.push("/admin/konsultasi")}
            aria-label={`Notifikasi admin${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <Bell size={19} aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <span className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 min-[420px]:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-extrabold text-white">
              {session.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="max-w-[10rem] truncate text-xs font-bold text-slate-700">
              {session.name}
            </span>
          </span>
        </header>

        <main className="min-w-0 flex-1 p-3 pb-10 sm:p-5">{children}</main>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
          <div className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Pill size={17} aria-hidden />
              </span>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-slate-800">Admin Sehatku</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Panel Apoteker
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <nav aria-label="Navigasi admin" className="flex-1 overflow-y-auto p-3">
              {navList}
              <div className="mt-2 space-y-1 border-t border-slate-100 pt-3">
                <Link
                  href="/"
                  className="flex min-h-[52px] items-center gap-3 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  <Store size={19} aria-hidden /> Lihat Toko
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={19} aria-hidden /> Keluar
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
