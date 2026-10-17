import { useCallback } from 'react';
import { Text } from 'react-native';
import { Redirect, Link, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import { entityId, referenceId, resourceApis, classesApi, coachesApi, type ResourceKey } from '@/services/operations';
import { canReadResource, scopeCoachRecords } from '@/utils/role-workflows';
import { isResource, resources } from '@/utils/resources';
import { canUseResource, personalResources } from '@/utils/resource-access';
import { useActorProfile } from '@/hooks/use-actor-profile';
import { useApiQuery } from '@/hooks/use-api-query';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Brand, Screen } from '@/components/sport/ui';
import { CoachAttendanceForm } from '@/components/sport/coach-attendance-form';
import { ResourceForm } from '@/components/sport/resource-form';
import { ui } from '@/components/sport/styles';
function ResourceEditor({ resource, id, classId, lessonId, date, scheduleId }: { resource: ResourceKey; id?: string; classId?: string; lessonId?: string; date?: string; scheduleId?: string }) {
  const { user, token } = useAuth();
  const api = resourceApis[resource];
  const needsActor = user?.role === 'MEMBER' && personalResources.includes(resource) || user?.role === 'COACH' && ['attendances', 'lesson-progress', 'workout-plans', 'workout-results'].includes(resource);
  const actor = useActorProfile(needsActor);
  const actorId = actor.data ? entityId(actor.data) : '';
  const load = useCallback(async () => {
    const records = resource === 'rooms' && id ? [await resourceApis.rooms.get(token!, id)] : await resourceApis[resource].list(token!);
    if (!Array.isArray(records)) throw new Error('Danh sách từ máy chủ không hợp lệ.');
    if (user?.role === 'COACH' && ['attendances', 'lesson-progress'].includes(resource)) {
      const [classes, students] = await Promise.all([classesApi.list(token!), coachesApi.myStudents(token!)]);
      return scopeCoachRecords(resource, records, classes.filter(item => referenceId(item.coachId) === actorId), students);
    }
    return records;
  }, [resource, token, id, user, actorId]);
  const query = useApiQuery(load, !!token && canReadResource(resource, user?.role) && !!id && (!needsActor || !!actorId));
  if (!user || !token) return <AccessScreen />;
  if (!canReadResource(resource, user.role)) return <AccessScreen denied />;
  const selected = query.data?.find(item => entityId(item) === id);
  if (needsActor && (actor.loading || actor.error)) return <Screen><Brand /><QueryStatus loading={actor.loading} error={actor.error} retry={actor.reload} />{user.role === 'MEMBER' && <Link href="/profile" style={ui.link}>Hồ sơ hội viên →</Link>}</Screen>;
  if (!canUseResource(resource, user.role, id ? 'update' : 'create', selected, actorId) || (id && !('update' in api)) || (id && resource === 'class-registrations' && user.role === 'MEMBER')) return <AccessScreen denied />;
  return <Screen><Brand /><Link href={{ pathname: '/workspace/[resource]', params: { resource } }} style={ui.link}>← {resources[resource].title}</Link><Text style={ui.title}>{id ? 'Chỉnh sửa' : 'Thêm'} {resources[resource].singular}</Text>
    {resource === 'class-registrations' && !id && <Text style={ui.body}>Đăng ký mới ở trạng thái chờ thanh toán. Thanh toán và xác nhận được xử lý riêng.</Text>}
    {resource === 'coaches' && !id && <Text style={ui.body}>Chọn User ID của tài khoản đã đăng ký với vai trò COACH. Hồ sơ huấn luyện viên và tài khoản đăng nhập là hai bản ghi riêng.</Text>}
    {id && <QueryStatus loading={query.loading} error={query.error} retry={query.reload} />}
    {id && !query.loading && !query.error && !selected && <Text style={ui.error}>Không tìm thấy bản ghi. Có thể dữ liệu đã được xóa.</Text>}
    {(!id || selected) && (resource === 'attendances' && user.role === 'COACH' ? <CoachAttendanceForm token={token} initial={selected} defaults={{ ...(classId ? { classId } : {}), ...(date ? { date } : {}), ...(scheduleId ? { scheduleId } : {}) }} onSaved={() => router.dismissTo({ pathname: '/workspace/[resource]', params: { resource } })} /> : <ResourceForm key={id || 'new'} resource={resource} role={user.role} actorId={actorId} token={token} userId={user.id} defaults={!id && resource === 'attendances' ? { ...(classId ? { classId } : {}), ...(lessonId ? { lessonId } : {}), ...(date ? { date } : {}) } : undefined} initial={selected} onSave={input => id && 'update' in api ? api.update(token, id, input) : api.create(token, input)} onSaved={() => router.dismissTo({ pathname: '/workspace/[resource]', params: { resource } })} />)}
  </Screen>;
}
export default function EditResourceRoute() {
  const { resource, id, classId, lessonId, date, scheduleId } = useLocalSearchParams<{ resource?: string; id?: string; classId?: string; lessonId?: string; date?: string; scheduleId?: string }>();
  if (!isResource(resource)) return <Screen><Text style={ui.title}>Không tìm thấy chức năng</Text><Link href="/operations" style={ui.link}>Quay lại</Link></Screen>;
  if (resource === 'class-registrations') return id ? <Redirect href={{ pathname: '/registration-detail', params: { id } }} /> : <Redirect href={{ pathname: '/enroll', params: classId ? { classId } : {} }} />;
  return <ResourceEditor key={`${resource}:${id || 'new'}:${classId || ''}:${date || ''}:${scheduleId || ''}`} resource={resource} id={id} classId={classId} lessonId={lessonId} date={date} scheduleId={scheduleId} />;
}
