import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
        <PackageSearch size={42} aria-hidden />
      </div>
      <h1 className="mt-5 text-xl font-extrabold text-slate-800">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        Alamat yang Anda buka tidak tersedia. Mungkin produk sudah dihapus atau tautan salah.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-600 px-6 text-sm font-bold text-white"
        >
          Ke Beranda
        </Link>
        <Link
          href="/obat"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-primary-700 ring-1 ring-primary-600/25"
        >
          Cari Obat
        </Link>
      </div>
    </div>
  );
}
