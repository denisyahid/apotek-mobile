"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DATA_CHANGED_EVENT, StorageKeys } from "@/lib/storage";
import { notificationService } from "@/services/notificationService";
import type { AppNotification, Role } from "@/types";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationsProvider({ audience, children }: { audience: Role; children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(() => {
    notificationService.list(audience).then(setNotifications).finally(() => setReady(true));
  }, [audience]);

  useEffect(() => {
    reload();
    const onDataChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (!detail || detail.key === StorageKeys.notifications || detail.key === "*") reload();
    };
    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);
    // refresh saat tab kembali aktif (prototype single-device multi-tab)
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
      window.removeEventListener("focus", reload);
    };
  }, [reload]);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead(audience);
    reload();
  }, [audience, reload]);

  const markRead = useCallback(
    async (ids: string[]) => {
      await notificationService.markRead(ids);
      reload();
    },
    [reload]
  );

  const unreadCount = ready ? notifications.filter((n) => !n.read).length : 0;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications harus dipakai di dalam NotificationsProvider");
  return ctx;
}
