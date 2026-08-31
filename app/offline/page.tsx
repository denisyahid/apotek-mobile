import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
        <WifiOff size={42} aria-hidden />
      </div>
      <h1 className="mt-5 text-xl font-extrabold text-slate-800">Anda sedang offline</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        Periksa koneksi internet Anda lalu muat ulang halaman. Katalog yang pernah Anda buuka
        tetap dapat diakses offline.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-600 px-6 text-sm font-bold text-white"
      >
        Coba Muat Ulang
      </Link>
    </div>
  );
}
