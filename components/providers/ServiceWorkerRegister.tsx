"use client";

import { useEffect } from "react";

/** Registrasi service worker PWA (hanya di browser, https/localhost) */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.info("[pwa] Service worker tidak dapat didaftarkan:", error);
    });
  }, []);

  return null;
}
