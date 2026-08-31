"use client";

import type { LucideIcon } from "lucide-react";
import { formatIDR, formatNumberID } from "@/lib/format";

/** Card statistik dashboard — 2 kolom di mobile, 3-4 di desktop */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "teal",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "sky" | "violet" | "green" | "red";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    teal: "bg-primary-50 text-primary-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-500",
  };
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={17} aria-hidden />
        </span>
      </div>
      <p className="mt-2 truncate text-xl font-extrabold text-slate-800">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

/** Bar chart ringan berbasis div (tanpa library — hemat bundle) */
export function MiniBarChart({
  data,
  valueFormatter = (v: number) => formatNumberID(v),
  color = "bg-primary-500",
  label,
}: {
  data: { label: string; value: number }[];
  valueFormatter?: (v: number) => string;
  color?: string;
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <figure className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
      <figcaption className="mb-3 text-sm font-bold text-slate-800">{label}</figcaption>
      <div className="flex h-36 items-end gap-1.5 sm:gap-2.5">
        {data.map((d) => {
          const pct = Math.max((d.value / max) * 100, d.value > 0 ? 6 : 2);
          return (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                {d.value > 0 ? valueFormatter(d.value) : ""}
              </span>
              <div
                role="img"
                aria-label={`${d.label}: ${valueFormatter(d.value)}`}
                className={`w-full rounded-t-lg transition-all ${color} ${
                  d.value === 0 ? "opacity-25" : ""
                }`}
                style={{ height: `${pct}%` }}
              />
              <span className="truncate text-[10px] font-semibold text-slate-400">{d.label}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export function formatIDRShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return formatIDR(value);
}
