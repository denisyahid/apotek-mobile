"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  Info,
  LogOut,
  MessagesSquare,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { APP_NAME, MEDICAL_DISCLAIMER } from "@/lib/constants";

const MENU = [
  { href: "/pesanan", label: "Pesanan Saya", icon: ClipboardList, description: "Lacak & riwayat" },
  { href: "/konsultasi", label: "Konsultasi Saya", icon: MessagesSquare, description: "Chat dengan apoteker" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { session, loading, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast("Anda telah keluar", "info");
    router.replace("/");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="text-lg font-extrabold text-slate-800">Profil</h1>

      {/* Kartu pengguna */}
      <div className="mt-4 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white shadow-lg">
        {loading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-white/20" />
        ) : session ? (
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-extrabold">
              {session.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-extrabold">{session.name}</p>
              <p className="truncate text-xs text-primary-100">{session.email}</p>
              <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {session.role === "admin" ? "Apoteker / Admin" : "Pasien"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20"
              onClick={handleLogout}
            >
              <LogOut size={15} aria-hidden /> Keluar
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-base font-extrabold">Anda belum masuk</p>
            <p className="mt-1 text-xs text-primary-100">
              Masuk untuk menyimpan riwayat pesanan & konsultasi di perangkat ini
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href="/masuk"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-primary-700"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white/15 px-6 text-sm font-bold text-white ring-1 ring-inset ring-white/40"
              >
                Daftar
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav aria-label="Menu akun" className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5">
        <ul className="divide-y divide-slate-100">
          {MENU.map((m) => (
            <li key={m.href}>
              <Link href={m.href} className="flex min-h-[60px] items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <m.icon size={18} aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-slate-800">{m.label}</span>
                  <span className="block text-xs text-slate-400">{m.description}</span>
                </span>
                <ChevronRight size={18} className="text-slate-300" aria-hidden />
              </Link>
            </li>
          ))}
          <li>
            <Link href="/admin/login" className="flex min-h-[60px] items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <ShieldCheck size={18} aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-slate-800">Login Admin / Apoteker</span>
                <span className="block text-xs text-slate-400">Dashboard pengelolaan apotek</span>
              </span>
              <ChevronRight size={18} className="text-slate-300" aria-hidden />
            </Link>
          </li>
        </ul>
      </nav>

      {/* Info aplikasi */}
      <div className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Info size={15} className="text-primary-600" aria-hidden /> Tentang {APP_NAME}
        </p>
        <p className="text-xs leading-relaxed text-slate-500">
          {APP_NAME} adalah prototype aplikasi apotek online: pemesanan obat, konsultasi apoteker,
          pembayaran, dan pelacakan pesanan. Data prototype tersimpan lokal di browser Anda
          (LocalStorage) — belum terhubung ke server.
        </p>
        <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-600/15">
          ⚠️ {MEDICAL_DISCLAIMER}
        </p>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
        <Store size={12} aria-hidden /> Apotek Sehatku · Jakarta Selatan · 0812-0000-0000
        <UserRound size={12} className="ml-1" aria-hidden /> v1.0.0 prototype
      </p>
    </div>
  );
}
