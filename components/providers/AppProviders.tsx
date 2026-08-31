"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { ToastProvider } from "@/hooks/useToast";

/**
 * Provider global: Toast > Auth > Cart (badge realtime) > Notifications.
 * Audience notifikasi mengikuti area (admin/pasien) berdasarkan pathname.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const audience = pathname.startsWith("/admin") ? "admin" : "patient";

  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationsProvider audience={audience as "admin" | "patient"}>
            {children}
          </NotificationsProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
