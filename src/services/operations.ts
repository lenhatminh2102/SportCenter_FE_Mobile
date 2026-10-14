import { request } from './api';
export type Entity = { id?: string; _id?: string; [key: string]: unknown };
export type ResourceInput = Record<string, string | number>;
export type ResourceKey = 'coaches' | 'schedules' | 'activity-logs' | 'subjects' | 'courses' | 'lessons' | 'classes' | 'class-registrations' | 'attendances' | 'learning-paths' | 'lesson-progress' | 'workout-plans' | 'workout-results';
export const entityId = (entity: Entity) => entity.id || entity._id || '';
export function referenceId(value: unknown): string {
  return typeof value === 'string' ? value : value && typeof value === 'object' ? entityId(value as Entity) : '';
}
export function referenceLabel(value: unknown): string {
  if (!value || typeof value !== 'object') return typeof value === 'string' ? value : 'Chưa có';
  const item = value as Entity;
  return String(item.name || item.title || item.fullName || item.email || item.goal || entityId(item) || 'Chưa có');
}
function fields(input: ResourceInput, keys: string[]) {
  return Object.fromEntries(keys.filter(key => input[key] !== undefined && !(key === 'classId' && input[key] === '')).map(key => [key, typeof input[key] === 'string' ? input[key].trim() : input[key]]));
}
function crud(path: string, keys: string[], updateKeys = keys) {
  return {
    list: (token: string) => request<Entity[]>(path, { token }),
    create: (token: string, input: ResourceInput) => request<Entity>(path, { token, body: fields(input, keys) }),
    update: (token: string, id: string, input: ResourceInput) => request<Entity>(`${path}/${encodeURIComponent(id)}`, { token, method: 'PUT', body: fields(input, updateKeys) }),
    remove: (token: string, id: string) => request<void>(`${path}/${encodeURIComponent(id)}`, { token, method: 'DELETE' }),
  };
}
export const coachesApi = crud('/api/coaches', ['userId', 'fullName', 'phone'], ['fullName', 'phone']);
export const subjectsApi = crud('/api/subjects', ['name']);
export const coursesApi = crud('/api/courses', ['name', 'description', 'status']);
export const lessonsApi = crud('/api/lessons', ['learningPathId', 'title', 'description', 'order']);
export const schedulesApi = {
  ...crud('/api/schedules', ['classId', 'lessonId', 'date', 'startTime', 'endTime', 'status']),
  my: (token: string) => request<Entity[]>('/api/schedules/my', { token }),
};
export const activityLogsApi = {
  list: (token: string) => request<Entity[]>('/api/activity-logs', { token }),
  create: (token: string, input: ResourceInput) => request<Entity>('/api/activity-logs', { token, body: fields(input, ['userId', 'action']) }),
};
export const classesApi = crud('/api/classes', ['name', 'subjectId', 'courseId', 'coachId']);
const registrationCrud = crud('/api/class-registrations', ['classId', 'memberId'], ['classId', 'memberId', 'status']);
export const classRegistrationsApi = { list: registrationCrud.list, create: registrationCrud.create, update: registrationCrud.update };
export const attendancesApi = crud('/api/attendances', ['memberId', 'classId', 'lessonId', 'date', 'status']);
export const learningPathsApi = crud('/api/learning-paths', ['courseId', 'name', 'description']);
const progressCrud = crud('/api/lesson-progress', ['memberId', 'lessonId', 'status']);
export const lessonProgressApi = { list: progressCrud.list, create: progressCrud.create, update: progressCrud.update };
export const workoutPlansApi = crud('/api/workout-plans', ['coachId', 'memberId', 'classId', 'goal', 'level', 'plan', 'source', 'status']);
const resultCrud = crud('/api/workout-results', ['workoutPlanId', 'memberId', 'result', 'comment']);
export const workoutResultsApi = { list: resultCrud.list, create: resultCrud.create, update: resultCrud.update };
export const resourceApis = { coaches: coachesApi, schedules: schedulesApi, 'activity-logs': activityLogsApi, subjects: subjectsApi, courses: coursesApi, lessons: lessonsApi, classes: classesApi, 'class-registrations': classRegistrationsApi, attendances: attendancesApi, 'learning-paths': learningPathsApi, 'lesson-progress': lessonProgressApi, 'workout-plans': workoutPlansApi, 'workout-results': workoutResultsApi };
