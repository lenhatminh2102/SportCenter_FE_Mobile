import { entityId, referenceId, type Entity } from '@/services/operations';
export type CoachStudent = Entity & { memberId: string; member?: Entity; class: Entity; status: 'PENDING_PAYMENT' | 'CONFIRMED' };
export function buildCoachRoster(registrations: Entity[], classes: Entity[], coachId: string): CoachStudent[] {
  if (!coachId) return [];
  const ownClasses = new Map(classes.filter(item => referenceId(item.coachId) === coachId).map(item => [entityId(item), item]));
  return registrations.flatMap(record => {
    const classInfo = ownClasses.get(referenceId(record.classId)); const memberId = referenceId(record.memberId);
    if (!classInfo || !memberId || !['PENDING_PAYMENT', 'CONFIRMED'].includes(String(record.status))) return [];
    const member = record.memberId && typeof record.memberId === 'object' ? record.memberId as Entity : undefined;
    return [{ id: entityId(record) || `${entityId(classInfo)}:${memberId}`, memberId, member, class: classInfo, status: record.status as CoachStudent['status'], registeredAt: record.registeredAt || record.createdAt }];
  }).sort((a, b) => String(b.registeredAt || '').localeCompare(String(a.registeredAt || '')));
}
export function coachStudentName(item: CoachStudent) {
  const name = item.member?.fullName;
  return typeof name === 'string' && name.trim() ? name.trim() : 'Chưa tải được tên hội viên';
}
