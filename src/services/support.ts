import { request } from './api';
import { referenceId, type Entity } from './operations';
export const supportApi = {
  list: (token: string) => request<Entity[]>('/api/support-requests', { token }),
  create: (token: string, memberId: string, message: string) => request<Entity>('/api/support-requests', { token, body: { memberId, message: message.trim() } }),
  update: (token: string, id: string, status: 'PENDING' | 'RESOLVED') => request<Entity>(`/api/support-requests/${encodeURIComponent(id)}`, { token, method: 'PUT', body: { status } }),
};
export const canResolveSupport = (role?: string) => ['CENTER_MANAGER', 'RECEPTIONIST'].includes(role || '');
export const ownSupport = (items: Entity[], memberId: string) => items.filter(item => !!memberId && referenceId(item.memberId) === memberId);
