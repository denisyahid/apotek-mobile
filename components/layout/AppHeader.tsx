"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronDown, MapPin, Pill, Store, Truck } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/StateViews";
import { useNotifications } from "@/hooks/useNotifications";
import { APP_NAME } from "@/lib/constants";
import { formatDateID, timeAgoID } from "@/lib/format";
import { getRepositories } from "@/repositories";
import type { ShippingConfig } from "@/types";
import { notificationIcons } from "@/components/layout/notificationIcons";

const NOTIF_TYPE_TONE: Record<string, string> = {
  order: "bg-sky-50 text-sky-600",
  payment: "bg-amber-50 text-amber-600",
  chat: "bg-violet-50 text-violet-600",
  recommendation: "bg-primary-50 text-primary-600",
  system: "bg-slate-100 text-slate-500",
};

/** Header sticky pasien: logo, lokasi/layanan, lonceng notifikasi */
export function AppHeader() {
  const pathname = usePathname() ?? "/";
  // fullscreen chat memakai header sendiri
  if (/^\/konsultasi\/[^/]+/.test(pathname)) return null;

  return <HeaderContent />;
}

function HeaderContent() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [shipping, setShipping] = useState<ShippingConfig | null>(null);

  const openLocation = async () => {
    if (!shipping) setShipping(await getRepositories().shipping.getConfig());
    setLocationOpen(true);
  };

  const openNotif = () => {
    setNotifOpen(true);
    if (unreadCount > 0) markAllRead();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label={`${APP_NAME} — Beranda`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm">
              <Pill size={20} aria-hidden />
            </span>
            <span className="hidden text-base font-extrabold tracking-tight text-slate-800 min-[380px]:block">
              Apotek <span className="text-primary-600">Sehatku</span>
            </span>
          </Link>

          <div className="flex-1" />

          {/* Lokasi / layanan */}
          <button
            type="button"
            onClick={openLocation}
            className="flex min-h-[44px] items-center gap-1 rounded-xl px-2 text-left hover:bg-slate-50"
            aria-label="Informasi lokasi dan layanan"
          >
            <MapPin size={16} className="shrink-0 text-primary-600" aria-hidden />
            <span className="hidden text-xs font-semibold text-slate-600 min-[420px]:block">
              Jakarta Selatan
            </span>
            <ChevronDown size={14} className="text-slate-400" aria-hidden />
          </button>

          {/* Notifikasi */}
          <button
            type="button"
            onClick={openNotif}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50"
            aria-label={unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"}
          >
            <Bell size={20} aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Sheet notifikasi */}
      <BottomSheet open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifikasi">
        {notifications.length === 0 ? (
          <EmptyState
            title="Belum ada notifikasi"
            description="Notifikasi pesanan, pembayaran, dan balasan konsultasi akan muncul di sini."
          />
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => {
              const Icon = notificationIcons[n.type] ?? notificationIcons.system;
              return (
                <li key={n.id}>
                  <Link
                    href={n.link ?? "/pesanan"}
                    onClick={() => setNotifOpen(false)}
                    className="flex gap-3 rounded-2xl p-3 transition-colors hover:bg-slate-50 active:bg-slate-100"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        NOTIF_TYPE_TONE[n.type] ?? NOTIF_TYPE_TONE.system
                      }`}
                    >
                      <Icon size={20} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{n.body}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {timeAgoID(n.createdAt)} · {formatDateID(n.createdAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </BottomSheet>

      {/* Sheet lokasi & layanan */}
      <BottomSheet open={locationOpen} onClose={() => setLocationOpen(false)} title="Lokasi & Layanan">
        {shipping && (
          <div className="space-y-3">
            <div className="flex gap-3 rounded-2xl bg-primary-50 p-4">
              <Store size={22} className="shrink-0 text-primary-600" aria-hidden />
              <div>
                <p className="text-sm font-bold text-slate-800">Ambil di Tempat</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {shipping.pickup.name}
                  <br />
                  {shipping.pickup.address}, {shipping.pickup.city}
                  <br />
                  {shipping.pickup.hours}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
              <Truck size={22} className="shrink-0 text-slate-600" aria-hidden />
              <div>
                <p className="text-sm font-bold text-slate-800">Diantar ke Alamat</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Layanan pengiriman ke alamat Anda. Ongkos kirim ditentukan apotek
                  (prototype: tarif tetap, nantinya dihitung otomatis via API ekspedisi).
                </p>
              </div>
            </div>
            <Button variant="outline" fullWidth onClick={() => setLocationOpen(false)}>
              Mengerti
            </Button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
