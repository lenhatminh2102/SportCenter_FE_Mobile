import { request } from './api';
import { referenceId, type Entity } from './operations';
export const notificationsApi = {
  list: (token: string) => request<Entity[]>('/api/notifications', { token }),
  create: (token: string, input: { userId: string; title: string; message: string }) => request<Entity>('/api/notifications', { token, body: { userId: input.userId, title: input.title.trim(), message: input.message.trim() } }),
  setRead: (token: string, id: string, isRead: boolean) => request<Entity>(`/api/notifications/${encodeURIComponent(id)}`, { token, method: 'PUT', body: { isRead } }),
};
export const ownNotifications = (items: Entity[], userId: string) => items.filter(item => referenceId(item.userId) === userId);
export const canSendNotification = (role?: string) => ['CENTER_MANAGER', 'COACH', 'RECEPTIONIST'].includes(role || '');
