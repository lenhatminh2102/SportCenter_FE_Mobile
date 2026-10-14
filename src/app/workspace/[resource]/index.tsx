import { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import { entityId, referenceLabel, resourceApis, schedulesApi, type Entity, type ResourceKey } from '@/services/operations';
import { resources, isResource, canWriteResource } from '@/utils/resources';
import { useApiQuery } from '@/hooks/use-api-query';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Brand, Button, Field, Screen } from '@/components/sport/ui';
import { DeleteResource } from '@/components/sport/delete-resource';
import { ui } from '@/components/sport/styles';
function titleFor(resource: ResourceKey, item: Entity) {
  if (resource === 'schedules') return `${String(item.date || '').slice(0, 10)} · ${String(item.startTime || '')} – ${String(item.endTime || '')}`;
  return String(item[resources[resource].titleKey] || 'Chưa có tên');
}
function detailFor(resource: ResourceKey, item: Entity) {
  switch (resource) {
    case 'coaches': return String(item.phone || '');
    case 'subjects': return 'Môn thể thao trên hệ thống';
    case 'courses': return `${item.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}\n${String(item.description || '')}`;
    case 'lessons': return `Bài ${String(item.order)} · ${referenceLabel(item.learningPathId)}\n${String(item.description || '')}`;
    case 'schedules': return `${referenceLabel(item.classId)} · ${referenceLabel(item.lessonId)}\n${({ SCHEDULED: 'Đã lên lịch', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' } as Record<string, string>)[String(item.status)] || String(item.status || '')}`;
    case 'activity-logs': return `${referenceLabel(item.userId)}\n${item.createdAt ? new Date(String(item.createdAt)).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' }) : ''}`;
  }
}
function ResourceList({ resource }: { resource: ResourceKey }) {
  const { user, token } = useAuth();
  const definition = resources[resource];
  const api = resourceApis[resource];
  const [search, setSearch] = useState('');
  const [allSchedules, setAllSchedules] = useState(false);
  const mine = resource === 'schedules' && user?.role === 'MEMBER' && !allSchedules;
  const load = useCallback(async () => {
    const records = await (mine ? schedulesApi.my(token!) : resourceApis[resource].list(token!));
    if (!Array.isArray(records)) throw new Error('Danh sách từ máy chủ không hợp lệ.');
    return records;
  }, [resource, token, mine]);
  const query = useApiQuery(load, !!token, false);
  const { reload } = query;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  const items = useMemo(() => (query.data || []).filter(item => `${titleFor(resource, item)} ${detailFor(resource, item)}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))), [query.data, resource, search]);
  if (!user || !token) return <AccessScreen />;
  const canWrite = canWriteResource(user.role);
  return <SafeAreaView style={ui.page}><FlatList contentContainerStyle={ui.content} data={items} keyExtractor={entityId} refreshing={query.loading} onRefresh={reload} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={{ gap: 16, marginBottom: 20 }}><Brand /><Link href="/operations" style={ui.link}>← Chức năng</Link><Text style={ui.title}>{mine ? 'Lịch tập của tôi' : definition.title}</Text><Text style={ui.body}>{query.data?.length || 0} bản ghi</Text>{resource === 'schedules' && user.role === 'MEMBER' && <Button secondary title={mine ? 'Xem tất cả lịch tập' : 'Xem lịch tập của tôi'} onPress={() => setAllSchedules(value => !value)} />}{canWrite && <Button title={`+ Thêm ${definition.singular}`} onPress={() => router.push({ pathname: '/workspace/[resource]/edit', params: { resource } })} />}<Field label="Tìm kiếm" value={search} onChangeText={setSearch} placeholder={`Tìm ${definition.singular}`} /><QueryStatus loading={query.loading} error={query.error} retry={reload} />{mine && query.missing && <Link href="/profile" style={ui.link}>Tạo hồ sơ hội viên để xem lịch →</Link>}</View>}
    ListEmptyComponent={!query.loading && !query.error ? <Text style={ui.body}>{search ? 'Không có kết quả phù hợp.' : mine ? 'Bạn chưa có lịch từ lớp đã được xác nhận đăng ký.' : 'Chưa có dữ liệu.'}</Text> : null}
    ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
    renderItem={({ item }) => <View style={ui.card}><Text style={ui.heading}>{titleFor(resource, item)}</Text><Text style={ui.body}>{detailFor(resource, item)}</Text>{canWrite && 'update' in api && <Button secondary title="Chỉnh sửa" onPress={() => router.push({ pathname: '/workspace/[resource]/edit', params: { resource, id: entityId(item) } })} />}{canWrite && 'remove' in api && <DeleteResource title={titleFor(resource, item)} onDelete={() => api.remove(token, entityId(item))} onDeleted={reload} />}</View>}
  /></SafeAreaView>;
}
export default function ResourceRoute() {
  const { resource } = useLocalSearchParams<{ resource?: string }>();
  if (!isResource(resource)) return <Screen><Text style={ui.title}>Không tìm thấy chức năng</Text><Link href="/operations" style={ui.link}>Quay lại</Link></Screen>;
  return <ResourceList key={resource} resource={resource} />;
}
