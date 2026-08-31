"use client";

import { useEffect, useState } from "react";

/** Debounce nilai (dipakai search real-time agar hemat render/request) */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** true setelah komponen terpasang di browser (mencegah hydration mismatch LocalStorage) */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
