"use client";

import type { ReactNode } from "react";
import { CircleAlert, Inbox, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Empty state — semua halaman wajib punya */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
        {icon ?? <Inbox size={36} aria-hidden />}
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Error state — pesan mudah dipahami, tanpa stack trace */
export function ErrorState({
  title = "Terjadi kesalahan",
  message = "Maaf, terjadi kendala saat memuat data. Coba lagi beberapa saat.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center px-6 py-14 text-center"
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-400">
        <CircleAlert size={36} aria-hidden />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden /> Coba Lagi
        </Button>
      )}
    </div>
  );
}

export function OfflineState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
        <WifiOff size={36} aria-hidden />
      </div>
      <h3 className="text-lg font-bold text-slate-800">Tidak ada koneksi</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
        Periksa koneksi internet Anda lalu coba muat ulang halaman. Katalog yang pernah dibuka
        tetap tersedia offline.
      </p>
    </div>
  );
}

/** Skeleton loading — jangan pernah menampilkan halaman kosong */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-2/5" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
          <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
