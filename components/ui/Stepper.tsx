"use client";

import { Minus, Plus } from "lucide-react";

/** Stepper kuantitas — tombol 44px, mudah ditekan di HP */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "Jumlah",
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const disableMinus = value <= min;
  const disablePlus = value >= max;

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
    >
      <button
        type="button"
        aria-label="Kurangi jumlah"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disableMinus}
        className={`flex ${dim} items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40`}
      >
        <Minus size={16} aria-hidden />
      </button>
      <span
        aria-live="polite"
        className={`min-w-[2.75rem] text-center text-sm font-bold tabular-nums text-slate-800 ${
          size === "sm" ? "py-2" : "py-3"
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Tambah jumlah"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disablePlus}
        className={`flex ${dim} items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40`}
      >
        <Plus size={16} aria-hidden />
      </button>
    </div>
  );
}
