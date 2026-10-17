import { buildCoachRoster, type CoachStudent } from '@/utils/coach-roster';
import { membersApi } from './members';
import { activityLogsApi, classRegistrationsApi, classesApi, coachesApi, schedulesApi, workoutPlansApi, workoutResultsApi, entityId, referenceId, type Entity } from './operations';
import type { StaffRole } from '@/utils/staff-navigation';
export type DashboardMetric = { label: string; value: number | null; resource: string };
export type DashboardData = { enrollments: CoachStudent[]; name: string; metrics: DashboardMetric[]; sessions: Entity[]; activity: Entity[]; week: { day: string; count: number | null }[]; errors: string[]; today: string };
export type DashboardSources = Partial<Record<'members' | 'coaches' | 'classes' | 'schedules' | 'registrations' | 'plans' | 'results' | 'logs', Entity[]>>;
export function bangkokDate(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(key => parts.find(part => part.type === key)!.value).join('-');
}
export function summarizeDashboard(role: StaffRole, userId: string, data: DashboardSources, now = new Date()): Omit<DashboardData, 'errors'> {
  const today = bangkokDate(now);
  const coach = data.coaches?.find(item => referenceId(item.userId) === userId);
  if (role === 'COACH' && !coach) throw new Error('Tài khoản chưa có hồ sơ huấn luyện viên hoặc không tải được hồ sơ. Liên hệ quản lý nếu bạn chưa có hồ sơ.');
  const coachId = coach ? entityId(coach) : '';
  const classes = role === 'COACH' ? data.classes?.filter(item => referenceId(item.coachId) === coachId) : data.classes;
  const classIds = new Set(classes?.map(entityId));
  const schedules = role === 'COACH' ? data.classes && data.schedules?.filter(item => classIds.has(referenceId(item.classId))) : data.schedules;
  const plans = role === 'COACH' ? data.plans?.filter(item => referenceId(item.coachId) === coachId) : data.plans;
  const enrollments = role === 'COACH' ? buildCoachRoster(data.registrations || [], data.classes || [], coachId) : [];
  const students = new Set(enrollments.map(item => item.memberId));
  const metrics: DashboardMetric[] = role === 'CENTER_MANAGER' ? [
    { label: 'Hội viên', value: data.members?.length ?? null, resource: 'members' },
    { label: 'Huấn luyện viên', value: data.coaches?.length ?? null, resource: 'coaches' },
    { label: 'Lớp học', value: classes?.length ?? null, resource: 'classes' },
    { label: 'Đăng ký chờ thanh toán', value: data.registrations?.filter(item => item.status === 'PENDING_PAYMENT').length ?? null, resource: 'class-registrations' },
  ] : [
    { label: 'Buổi dạy hôm nay', value: schedules?.filter(item => String(item.date).slice(0, 10) === today && item.status !== 'CANCELLED').length ?? null, resource: 'schedules' },
    { label: 'Lớp phụ trách', value: classes?.length ?? null, resource: 'classes' },
    { label: 'Học viên đăng ký', value: data.registrations && classes ? students.size : null, resource: 'coach-students' },
    { label: 'Kế hoạch bản nháp', value: plans?.filter(item => item.status === 'DRAFT').length ?? null, resource: 'workout-plans' },
  ];
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  const sessions = (schedules || []).filter(item => { const day = String(item.date).slice(0, 10); return item.status === 'SCHEDULED' && (day > today || day === today && String(item.startTime) >= time); }).sort((a, b) => `${String(a.date).slice(0, 10)} ${a.startTime}`.localeCompare(`${String(b.date).slice(0, 10)} ${b.startTime}`)).slice(0, 5);
  const ownPlanIds = new Set(plans?.map(entityId));
  const activity = role === 'CENTER_MANAGER' ? (data.logs || []).slice(0, 5) : (data.results || []).filter(item => ownPlanIds.has(referenceId(item.workoutPlanId))).slice(0, 5);
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(Date.parse(`${today}T00:00:00Z`) + index * 86400000).toISOString().slice(0, 10);
    return { day, count: schedules?.filter(item => String(item.date).slice(0, 10) === day && item.status !== 'CANCELLED').length ?? null };
  });
  return { enrollments, today, name: role === 'COACH' ? String(coach!.fullName || 'Coach') : 'Quản lý', metrics, sessions, activity, week };
}
export async function loadDashboard(role: StaffRole, userId: string, token: string): Promise<DashboardData> {
  const sources: [keyof DashboardSources, string, () => Promise<Entity[]>][] = [
    ['coaches', 'Huấn luyện viên', async () => role === 'COACH' ? [await coachesApi.me(token)] : coachesApi.list(token)], ['classes', 'Lớp học', () => classesApi.list(token)],
    ['schedules', 'Lịch tập', () => role === 'COACH' ? schedulesApi.coachMy(token) : schedulesApi.list(token)], ['registrations', 'Đăng ký lớp', () => classRegistrationsApi.list(token)],
    ...(role === 'CENTER_MANAGER' ? [
      ['members', 'Hội viên', async () => (await membersApi.list(token)).map(item => ({ ...item }))],
      ['logs', 'Lịch sử thao tác', () => activityLogsApi.list(token)],
    ] as [keyof DashboardSources, string, () => Promise<Entity[]>][] : [
      ['plans', 'Kế hoạch tập', () => workoutPlansApi.list(token)], ['results', 'Kết quả tập', () => workoutResultsApi.list(token)],
    ] as [keyof DashboardSources, string, () => Promise<Entity[]>][]),
  ];
  const results = await Promise.allSettled(sources.map(async ([, , load]) => {
    const items = await load();
    if (!Array.isArray(items)) throw new Error('Danh sách không hợp lệ.');
    return items;
  }));
  const data: DashboardSources = {};
  const errors: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') data[sources[index][0]] = result.value;
    else errors.push(`${sources[index][1]}: ${result.reason instanceof Error ? result.reason.message : 'Không tải được dữ liệu.'}`);
  });
  return { ...summarizeDashboard(role, userId, data), errors };
}
