import { getRepositories } from "@/repositories";
import { newNotification } from "@/repositories/local/config";
import type { AppNotification, NotificationType, Role } from "@/types";

/** Membuat & menyimpan notifikasi (prototype: LocalStorage → production: tabel `notifications`). */
export const notificationService = {
  async notifyPatient(input: {
    patientId?: string;
    title: string;
    body: string;
    type: NotificationType;
    link?: string;
  }): Promise<void> {
    const notification: AppNotification = newNotification({
      audience: "patient",
      patientId: input.patientId,
      title: input.title,
      body: input.body,
      type: input.type,
      link: input.link,
    });
    await getRepositories().notifications.save(notification);
  },

  async notifyAdmin(input: {
    title: string;
    body: string;
    type: NotificationType;
    link?: string;
  }): Promise<void> {
    const notification: AppNotification = newNotification({
      audience: "admin",
      title: input.title,
      body: input.body,
      type: input.type,
      link: input.link,
    });
    await getRepositories().notifications.save(notification);
  },

  async list(audience: Role): Promise<AppNotification[]> {
    return getRepositories().notifications.getAll(audience);
  },

  async markAllRead(audience: Role): Promise<void> {
    await getRepositories().notifications.markAllRead(audience);
  },

  async markRead(ids: string[]): Promise<void> {
    await getRepositories().notifications.markRead(ids);
  },
};
