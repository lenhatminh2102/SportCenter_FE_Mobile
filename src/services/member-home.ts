import { ApiError } from './api';
import { membersApi, type MemberProfile } from './members';
import { classRegistrationsApi, classesApi, schedulesApi, referenceId, type Entity } from './operations';
import { notificationsApi, ownNotifications } from './notifications';
import { paymentsApi, ownPayments } from './payments';
export type MemberHomeData = { profile: MemberProfile | null; profileMissing: boolean; classes: Entity[] | null; schedules: Entity[] | null; registrations: Entity[] | null; payments: Entity[] | null; unread: number | null; errors: string[] };
export function upcomingMemberSessions(items: Entity[], now = new Date()) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const day = `${date.find(p => p.type === 'year')?.value}-${date.find(p => p.type === 'month')?.value}-${date.find(p => p.type === 'day')?.value}`;
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  return items.filter(item => item.status === 'SCHEDULED' && (String(item.date).slice(0, 10) > day || String(item.date).slice(0, 10) === day && String(item.startTime) >= time)).sort((a, b) => `${String(a.date).slice(0, 10)} ${a.startTime}`.localeCompare(`${String(b.date).slice(0, 10)} ${b.startTime}`));
}
export async function loadMemberHome(token: string, userId: string): Promise<MemberHomeData> {
  const data: MemberHomeData = { profile: null, profileMissing: false, classes: null, schedules: null, registrations: null, payments: null, unread: null, errors: [] };
  async function capture<T>(label: string, fn: () => Promise<T>, accept: (value: T) => void) {
    try { accept(await fn()); } catch (e) { data.errors.push(`${label}: ${e instanceof Error ? e.message : 'Không tải được dữ liệu.'}`); }
  }
  await Promise.all([
    (async () => { try { data.profile = await membersApi.me(token); } catch (e) { if (e instanceof ApiError && e.status === 404) data.profileMissing = true; else data.errors.push(`Hồ sơ: ${e instanceof Error ? e.message : 'Không tải được hồ sơ.'}`); } })(),
    capture('Lớp học', () => classesApi.list(token), items => { data.classes = items; }),
    capture('Thông báo', () => notificationsApi.list(token), items => { data.unread = ownNotifications(items, userId).filter(item => !item.isRead).length; }),
  ]);
  const memberId = data.profile?.id || data.profile?._id;
  if (!memberId) return data;
  await Promise.all([
    capture('Lịch tập', () => schedulesApi.my(token), items => { data.schedules = items; }),
    capture('Đăng ký lớp', () => classRegistrationsApi.list(token), items => { data.registrations = items.filter(item => referenceId(item.memberId) === memberId); }),
  ]);
  if (data.registrations) await capture('Thanh toán', () => paymentsApi.list(token), items => { data.payments = ownPayments(items, data.registrations!, memberId); });
  return data;
}
