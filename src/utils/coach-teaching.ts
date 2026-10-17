import { entityId, referenceId, type Entity, type ResourceKey } from '@/services/operations';
export const teachingResources: ResourceKey[] = ['subjects', 'courses', 'learning-paths', 'lessons'];
export function scopeTeachingResources(resource: ResourceKey, records: Entity[], classes: Entity[], paths: Entity[]) {
  const subjectIds = new Set(classes.map(item => referenceId(item.subjectId)));
  const courseIds = new Set(classes.map(item => referenceId(item.courseId)));
  const pathIds = new Set(paths.filter(item => courseIds.has(referenceId(item.courseId))).map(entityId));
  if (resource === 'subjects') return records.filter(item => subjectIds.has(entityId(item)));
  if (resource === 'courses') return records.filter(item => courseIds.has(entityId(item)));
  if (resource === 'learning-paths') return records.filter(item => courseIds.has(referenceId(item.courseId)));
  if (resource === 'lessons') return records.filter(item => pathIds.has(referenceId(item.learningPathId)));
  return records;
}
export const dayOf = (value: unknown) => typeof value === 'string' ? value.slice(0, 10) : '';
export function classSessions(schedules: Entity[], classId: string, day?: string) {
  return schedules.filter(item => referenceId(item.classId) === classId && item.status !== 'CANCELLED' && (!day || dayOf(item.date) === day)).sort((a, b) => `${dayOf(a.date)} ${a.startTime}`.localeCompare(`${dayOf(b.date)} ${b.startTime}`));
}
export function attendanceMembers(students: Entity[], classId: string) {
  return students.filter(row => referenceId(row.class) === classId).map(row => row.member).filter((item): item is Entity => !!item && typeof item === 'object');
}
