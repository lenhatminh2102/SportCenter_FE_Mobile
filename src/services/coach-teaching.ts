import { request } from './api';
import { classesApi, coachesApi, learningPathsApi, schedulesApi, entityId, referenceId, type Entity } from './operations';
export async function loadTeachingScope(token: string, coachId: string) {
  if (!coachId) throw new Error('Chưa có hồ sơ huấn luyện viên.');
  const [classes, paths] = await Promise.all([classesApi.list(token), learningPathsApi.list(token)]);
  return { classes: classes.filter(item => referenceId(item.coachId) === coachId), paths };
}
export const coachAttendanceApi = {
  create: (token: string, memberId: string, scheduleId: string, status: string) => request<Entity>('/api/attendances/coach', { token, body: { memberId, scheduleId, status } }),
  bySchedule: (token: string, scheduleId: string) => request<Entity[]>(`/api/attendances/schedule/${encodeURIComponent(scheduleId)}`, { token }),
};
export async function loadCoachAttendanceContext(token: string) {
  const [coach, classes, schedules, students] = await Promise.all([coachesApi.me(token), classesApi.list(token), schedulesApi.coachMy(token), coachesApi.myStudents(token)]);
  const coachId = entityId(coach);
  if (!coachId) throw new Error('Chưa có hồ sơ huấn luyện viên.');
  const ownClasses = classes.filter(item => referenceId(item.coachId) === coachId); const classIds = new Set(ownClasses.map(entityId));
  return { classes: ownClasses, schedules: schedules.filter(item => classIds.has(referenceId(item.classId))), students: students.filter(item => classIds.has(referenceId(item.class))) };
}
