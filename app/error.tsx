"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

/** Error boundary global — pesan ramah pengguna, tanpa stack trace */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // dicatat ke console untuk debugging internal — tidak ditampilkan ke pengguna
    console.error("[app] Terjadi error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-red-50 text-red-400">
        <TriangleAlert size={42} aria-hidden />
      </div>
      <h1 className="mt-5 text-xl font-extrabold text-slate-800">Terjadi kesalahan</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        Maaf, terjadi kendala saat memuat halaman ini. Silakan coba lagi.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-bold text-white"
      >
        <RotateCcw size={16} aria-hidden /> Coba Lagi
      </button>
    </div>
  );
}
