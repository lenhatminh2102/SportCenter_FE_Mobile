import { useCallback } from 'react';
import { Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import { entityId, resourceApis, type ResourceKey } from '@/services/operations';
import { isResource, resources } from '@/utils/resources';
import { canUseResource, personalResources } from '@/utils/resource-access';
import { useActorProfile } from '@/hooks/use-actor-profile';
import { useApiQuery } from '@/hooks/use-api-query';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Brand, Screen } from '@/components/sport/ui';
import { ResourceForm } from '@/components/sport/resource-form';
import { ui } from '@/components/sport/styles';
function ResourceEditor({ resource, id }: { resource: ResourceKey; id?: string }) {
  const { user, token } = useAuth();
  const api = resourceApis[resource];
  const needsActor = user?.role === 'MEMBER' && personalResources.includes(resource) || user?.role === 'COACH' && ['workout-plans', 'workout-results'].includes(resource);
  const actor = useActorProfile(needsActor);
  const actorId = actor.data ? entityId(actor.data) : '';
  const load = useCallback(async () => {
    const records = await resourceApis[resource].list(token!);
    if (!Array.isArray(records)) throw new Error('Danh sách từ máy chủ không hợp lệ.');
    return records;
  }, [resource, token]);
  const query = useApiQuery(load, !!token && !!id && (!needsActor || !!actorId));
  if (!user || !token) return <AccessScreen />;
  const selected = query.data?.find(item => entityId(item) === id);
  if (needsActor && (actor.loading || actor.error)) return <Screen><Brand /><QueryStatus loading={actor.loading} error={actor.error} retry={actor.reload} />{user.role === 'MEMBER' && <Link href="/profile" style={ui.link}>Hồ sơ hội viên →</Link>}</Screen>;
  if (!canUseResource(resource, user.role, id ? 'update' : 'create', selected, actorId) || (id && !('update' in api)) || (id && resource === 'class-registrations' && user.role === 'MEMBER')) return <AccessScreen denied />;
  return <Screen><Brand /><Link href={{ pathname: '/workspace/[resource]', params: { resource } }} style={ui.link}>← {resources[resource].title}</Link><Text style={ui.title}>{id ? 'Chỉnh sửa' : 'Thêm'} {resources[resource].singular}</Text>
    {resource === 'coaches' && !id && <Text style={ui.body}>Chọn User ID của tài khoản đã đăng ký với vai trò COACH. Hồ sơ huấn luyện viên và tài khoản đăng nhập là hai bản ghi riêng.</Text>}
    {id && <QueryStatus loading={query.loading} error={query.error} retry={query.reload} />}
    {id && !query.loading && !query.error && !selected && <Text style={ui.error}>Không tìm thấy bản ghi. Có thể dữ liệu đã được xóa.</Text>}
    {(!id || selected) && <ResourceForm key={id || 'new'} resource={resource} role={user.role} actorId={actorId} token={token} userId={user.id} initial={selected} onSave={input => id && 'update' in api ? api.update(token, id, input) : api.create(token, input)} onSaved={() => router.dismissTo({ pathname: '/workspace/[resource]', params: { resource } })} />}
  </Screen>;
}
export default function EditResourceRoute() {
  const { resource, id } = useLocalSearchParams<{ resource?: string; id?: string }>();
  if (!isResource(resource)) return <Screen><Text style={ui.title}>Không tìm thấy chức năng</Text><Link href="/operations" style={ui.link}>Quay lại</Link></Screen>;
  return <ResourceEditor key={`${resource}:${id || 'new'}`} resource={resource} id={id} />;
}
