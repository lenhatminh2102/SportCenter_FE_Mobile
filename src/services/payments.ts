import { request } from './api';
import { entityId, referenceId, type Entity } from './operations';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'ONLINE';
export const paymentMethods: { value: PaymentMethod; label: string }[] = [{ value: 'CASH', label: 'Tiền mặt tại trung tâm' }, { value: 'BANK_TRANSFER', label: 'Chuyển khoản' }, { value: 'ONLINE', label: 'VNPay trực tuyến' }];
export const paymentsApi = {
  list: (token: string) => request<Entity[]>('/api/payments', { token }),
  create: (token: string, classRegistrationId: string, paymentMethod: PaymentMethod) => request<Entity>('/api/payments', { token, body: { classRegistrationId, paymentMethod } }),
  update: (token: string, id: string, paymentMethod: PaymentMethod) => request<Entity>(`/api/payments/${encodeURIComponent(id)}`, { token, method: 'PUT', body: { paymentMethod } }),
  vnpay: (token: string, id: string) => request<{ paymentUrl: string }>(`/api/payments/${encodeURIComponent(id)}/vnpay`, { token, body: {} }),
  simulate: (token: string, id: string, status: 'SUCCESS' | 'FAILED') => request<Entity>(`/api/payments/${encodeURIComponent(id)}/simulate`, { token, body: { status } }),
};
export const canManagePayments = (role?: string) => ['MEMBER', 'CENTER_MANAGER', 'RECEPTIONIST'].includes(role || '');
export function registrationFor(payment: Entity, registrations: Entity[]): Entity | undefined {
  const id = referenceId(payment.classRegistrationId);
  return registrations.find(item => entityId(item) === id) || (payment.classRegistrationId && typeof payment.classRegistrationId === 'object' ? payment.classRegistrationId as Entity : undefined);
}
export const ownPayments = (items: Entity[], registrations: Entity[], memberId: string) => items.filter(item => !!memberId && referenceId(registrationFor(item, registrations)?.memberId) === memberId);
export const currency = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? `${value.toLocaleString('vi-VN')} ₫` : 'Chưa có học phí';
export function validatePaymentUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['sandbox.vnpayment.vn', 'pay.vnpay.vn'].includes(url.hostname) || url.username || url.password) throw new Error('Địa chỉ VNPay từ máy chủ không hợp lệ.');
  return url.toString();
}
