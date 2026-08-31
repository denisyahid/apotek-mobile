"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useMounted } from "@/hooks/useDebounce";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** konten sticky di bawah sheet (tombol aksi) */
  footer?: ReactNode;
  /** sembunyikan header (untuk sheet penuhi layar seperti galeri) */
  hideHeader?: boolean;
}

/**
 * Bottom sheet untuk mobile; otomatis menjadi modal terpusat di layar ≥ sm.
 * Dipakai untuk filter, form admin, konfirmasi, dsb.
 */
export function BottomSheet({ open, onClose, title, children, footer, hideHeader }: BottomSheetProps) {
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={title ?? "Panel"}>
      {/* overlay */}
      <div className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={onClose} aria-hidden />
      {/* panel: bottom sheet di HP, modal di layar besar */}
      <div className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-white shadow-sheet animate-sheet-up sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[28rem] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:animate-none sm:rounded-3xl">
        {!hideHeader && (
          <div className="relative shrink-0 border-b border-slate-100 px-4 pb-3 pt-2">
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden />
            {title && <h2 className="text-center text-base font-bold text-slate-800">{title}</h2>}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
