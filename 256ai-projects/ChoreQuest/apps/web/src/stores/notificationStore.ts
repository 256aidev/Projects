import { create } from 'zustand';
import * as notificationsApi from '../api/notifications';
import type { Notification, NotificationParams } from '../api/notifications';

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;

  // Derived
  unreadCount: () => number;

  // Actions
  loadNotifications: (params?: NotificationParams) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  unreadCount: () => get().notifications.filter((n) => !n.is_read).length,

  loadNotifications: async (params) => {
    set({ loading: true, error: null });
    try {
      const notifications = await notificationsApi.getNotifications(params);
      set({ notifications, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      console.error('Load notifications error:', err);
      set({ loading: false, error: message });
    }
  },

  markRead: async (id) => {
    try {
      await notificationsApi.markRead(id);
      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n,
        ),
      });
    } catch (err) {
      console.error('Mark read error:', err);
    }
  },

  markAllRead: async () => {
    try {
      await notificationsApi.markAllRead();
      set({
        notifications: get().notifications.map((n) => ({ ...n, is_read: true })),
      });
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  },
}));
