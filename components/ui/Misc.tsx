"use client";

import { Check, Copy, Star } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";

/** Rating bintang (tampilan) */
export function RatingStars({
  rating,
  sold,
  className = "",
}: {
  rating: number;
  sold?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} dari 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            aria-hidden
            className={
              i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
            }
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-600">{rating.toFixed(1)}</span>
      {typeof sold === "number" && (
        <span className="text-xs text-slate-400">· {sold.toLocaleString("id-ID")} terjual</span>
      )}
    </div>
  );
}

/** Tombol salin (rekening, nomor pesanan) dengan feedback */
export function CopyButton({
  value,
  label = "Salin",
  compact = false,
}: {
  value: string;
  label?: string;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // fallback browser lama
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    toast("Berhasil disalin", "success");
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        aria-label={`Salin ${label}`}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100"
      >
        {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-50 px-4 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-100 active:bg-primary-200"
    >
      {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      {copied ? "Tersalin" : label}
    </button>
  );
}

/** Avatar inisial (pasien/admin) */
export function Avatar({
  name,
  size = "md",
  tone = "teal",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  tone?: "teal" | "slate" | "amber";
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const dims = size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-11 w-11 text-sm";
  const tones = {
    teal: "bg-primary-100 text-primary-700",
    slate: "bg-slate-200 text-slate-600",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${dims} ${tones[tone]}`}
    >
      {initials}
    </div>
  );
}

/** Judul section + link "Lihat semua" */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      {action}
    </div>
  );
}
