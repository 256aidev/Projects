import client from './client';

export interface Notification {
  id: string;
  type: 'chore_completed' | 'chore_approved' | 'chore_rejected' | 'chore_assigned' | 'chore_overdue' | 'reminder';
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

export interface NotificationParams {
  unread_only?: boolean;
  limit?: number;
}

export async function getNotifications(
  params?: NotificationParams,
): Promise<Notification[]> {
  const { data } = await client.get<Notification[]>(
    '/households/me/notifications',
    { params },
  );
  return data;
}

export async function markRead(id: string): Promise<void> {
  await client.post(`/households/me/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await client.post('/households/me/notifications/read-all');
}
