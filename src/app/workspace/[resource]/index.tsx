import { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { titleFor, detailFor } from '@/utils/resource-display';
import { useStaffShell } from '@/context/staff-shell';
import { useAuth } from '@/context/auth';
import { entityId, resourceApis, schedulesApi, type ResourceKey } from '@/services/operations';
import { resources, isResource } from '@/utils/resources';
import { canUseResource, isOwnRecord, personalResources } from '@/utils/resource-access';
import { useActorProfile } from '@/hooks/use-actor-profile';
import { useApiQuery } from '@/hooks/use-api-query';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Brand, Button, Field, Screen } from '@/components/sport/ui';
import { CancelRegistration } from '@/components/sport/cancel-registration';
import { DeleteResource } from '@/components/sport/delete-resource';
import { ui } from '@/components/sport/styles';
function ResourceList({ resource }: { resource: ResourceKey }) {
  const { user, token } = useAuth();
  const inStaffShell = useStaffShell();
  const definition = resources[resource];
  const api = resourceApis[resource];
  const needsActor = user?.role === 'MEMBER' && personalResources.includes(resource) || user?.role === 'COACH' && ['classes', 'schedules', 'workout-plans', 'workout-results'].includes(resource);
  const actor = useActorProfile(needsActor);
  const actorId = actor.data ? entityId(actor.data) : '';
  const [search, setSearch] = useState('');
  const [allSchedules, setAllSchedules] = useState(false);
  const mine = resource === 'schedules' && user?.role === 'MEMBER' && !allSchedules;
  const load = useCallback(async () => {
    const records = await (mine ? schedulesApi.my(token!) : resourceApis[resource].list(token!));
    if (!Array.isArray(records)) throw new Error('Danh sách từ máy chủ không hợp lệ.');
    return needsActor ? records.filter(item => isOwnRecord(resource, user!.role, actorId, item)) : records;
  }, [resource, token, mine, needsActor, actorId, user]);
  const query = useApiQuery(load, !!token && (!needsActor || !!actorId), false);
  const { reload } = query;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  const items = useMemo(() => (query.data || []).filter(item => `${titleFor(resource, item)} ${detailFor(resource, item)}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))), [query.data, resource, search]);
  if (!user || !token) return <AccessScreen />;
  const canCreate = canUseResource(resource, user.role, 'create', undefined, actorId);
  return <SafeAreaView edges={inStaffShell ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']} style={ui.page}><FlatList contentContainerStyle={ui.content} data={items} keyExtractor={entityId} refreshing={query.loading} onRefresh={reload} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={{ gap: 16, marginBottom: 20 }}><Brand /><Link href="/operations" style={ui.link}>← Chức năng</Link><Text style={ui.title}>{mine ? 'Lịch tập của tôi' : user.role === 'COACH' && resource === 'schedules' ? 'Lịch dạy của tôi' : user.role === 'COACH' && resource === 'classes' ? 'Lớp của tôi' : definition.title}</Text><Text style={ui.body}>{query.data?.length || 0} bản ghi</Text>{resource === 'schedules' && user.role === 'MEMBER' && <Button secondary title={mine ? 'Xem tất cả lịch tập' : 'Xem lịch tập của tôi'} onPress={() => setAllSchedules(value => !value)} />}{canCreate && <Button title={`+ Thêm ${definition.singular}`} onPress={() => router.push({ pathname: '/workspace/[resource]/edit', params: { resource } })} />}<Field label="Tìm kiếm" value={search} onChangeText={setSearch} placeholder={`Tìm ${definition.singular}`} /><QueryStatus loading={needsActor && actor.loading} error={needsActor ? actor.error : null} retry={actor.reload} />{needsActor && actor.error && user.role === 'MEMBER' && <Link href="/profile" style={ui.link}>Tạo hồ sơ hội viên →</Link>}<QueryStatus loading={query.loading} error={query.error} retry={reload} />{mine && query.missing && <Link href="/profile" style={ui.link}>Tạo hồ sơ hội viên để xem lịch →</Link>}</View>}
    ListEmptyComponent={!query.loading && !query.error && !actor.loading && !actor.error ? <Text style={ui.body}>{search ? 'Không có kết quả phù hợp.' : mine ? 'Bạn chưa có lịch từ lớp đã được xác nhận đăng ký.' : 'Chưa có dữ liệu.'}</Text> : null}
    ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
    renderItem={({ item }) => <View style={ui.card}><Text style={ui.heading}>{titleFor(resource, item)}</Text><Text style={ui.body}>{detailFor(resource, item)}</Text>{resource === 'classes' && ['MEMBER', 'RECEPTIONIST', 'CENTER_MANAGER'].includes(user.role) && <Button title="Đăng ký lớp →" onPress={() => router.push({ pathname: '/workspace/[resource]/edit', params: { resource: 'class-registrations', classId: entityId(item) } })} />}{resource === 'class-registrations' && user.role === 'MEMBER' && item.status !== 'CANCELLED' && canUseResource(resource, user.role, 'update', item, actorId) && <CancelRegistration item={item} token={token} onCancelled={reload} />}{canUseResource(resource, user.role, 'update', item, actorId) && !(resource === 'class-registrations' && user.role === 'MEMBER') && 'update' in api && <Button secondary title="Chỉnh sửa" onPress={() => router.push({ pathname: '/workspace/[resource]/edit', params: { resource, id: entityId(item) } })} />}{canUseResource(resource, user.role, 'remove', item, actorId) && 'remove' in api && <DeleteResource title={titleFor(resource, item)} onDelete={() => api.remove(token, entityId(item))} onDeleted={reload} />}</View>}
  /></SafeAreaView>;
}
export default function ResourceRoute() {
  const { resource } = useLocalSearchParams<{ resource?: string }>();
  if (!isResource(resource)) return <Screen><Text style={ui.title}>Không tìm thấy chức năng</Text><Link href="/operations" style={ui.link}>Quay lại</Link></Screen>;
  return <ResourceList key={resource} resource={resource} />;
}
