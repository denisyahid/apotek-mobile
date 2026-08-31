"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

let nextId = 1;

const STYLES: Record<ToastType, { icon: ReactNode; bar: string }> = {
  success: { icon: <CheckCircle2 size={20} aria-hidden />, bar: "bg-green-500" },
  error: { icon: <XCircle size={20} aria-hidden />, bar: "bg-red-500" },
  info: { icon: <Info size={20} aria-hidden />, bar: "bg-sky-500" },
  warning: { icon: <TriangleAlert size={20} aria-hidden />, bar: "bg-amber-500" },
};

const TEXT_COLOR: Record<ToastType, string> = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-sky-600",
  warning: "text-amber-600",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId++;
      setItems((prev) => [...prev.slice(-2), { id, type, message }]);
      window.setTimeout(() => remove(id), 3200);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — posisi atas agar tidak tertutup bottom nav / keyboard */}
      <div
        aria-live="polite"
        aria-label="Notifikasi"
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl bg-white p-3 shadow-lg ring-1 ring-slate-900/5 animate-toast-in"
          >
            <span className={`${TEXT_COLOR[t.type]} shrink-0`}>{STYLES[t.type].icon}</span>
            <p className="flex-1 text-sm font-medium text-slate-800">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Tutup notifikasi"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
