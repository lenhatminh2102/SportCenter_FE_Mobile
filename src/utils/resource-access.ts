import { referenceId, type Entity, type ResourceKey } from '@/services/operations';
export type ResourceAction = 'create' | 'update' | 'remove';
const writeRoles: Partial<Record<ResourceKey, string[]>> = {
  'class-registrations': ['MEMBER', 'RECEPTIONIST', 'CENTER_MANAGER'],
  attendances: ['CENTER_MANAGER', 'COACH', 'RECEPTIONIST'],
  'lesson-progress': ['MEMBER', 'COACH', 'CENTER_MANAGER'],
  'workout-plans': ['COACH'],
  'workout-results': ['COACH', 'MEMBER'],
};
export const personalResources: ResourceKey[] = ['class-registrations', 'attendances', 'lesson-progress', 'workout-plans', 'workout-results'];
export function isOwnRecord(resource: ResourceKey, role: string, actorId: string, item: Entity): boolean {
  if (!actorId) return false;
  if (role === 'MEMBER') return referenceId(item.memberId) === actorId;
  if (role === 'COACH' && resource === 'workout-plans') return referenceId(item.coachId) === actorId;
  if (role === 'COACH' && resource === 'workout-results') {
    const plan = item.workoutPlanId;
    return !!plan && typeof plan === 'object' && referenceId((plan as Entity).coachId) === actorId;
  }
  return true;
}
export function canUseResource(resource: ResourceKey, role: string, action: ResourceAction, item?: Entity, actorId = '') {
  if (action === 'remove' && ['class-registrations', 'lesson-progress', 'workout-results', 'activity-logs'].includes(resource)) return false;
  if (action === 'update' && resource === 'activity-logs') return false;
  if (!(writeRoles[resource] || ['CENTER_MANAGER']).includes(role)) return false;
  const needsOwner = role === 'MEMBER' && personalResources.includes(resource) || role === 'COACH' && ['workout-plans', 'workout-results'].includes(resource);
  return !needsOwner || (!!actorId && (!item || isOwnRecord(resource, role, actorId, item)));
}
