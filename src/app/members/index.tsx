import { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { membersApi, memberId } from '@/services/members';
import { canManageMembers } from '@/utils/permissions';
import { useApiQuery } from '@/hooks/use-api-query';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Brand, Button, Field } from '@/components/sport/ui';
import { levelLabels } from '@/components/sport/member-form';
import { ui } from '@/components/sport/styles';
export default function Members() {
  const { user, token } = useAuth();
  const [search, setSearch] = useState('');
  const load = useCallback(() => membersApi.list(token!), [token]);
  const query = useApiQuery(load, !!token, false);
  useFocusEffect(useCallback(() => { void query.reload(); }, [query.reload]));
  const filtered = useMemo(() => (query.data || []).filter(member => `${member.fullName} ${member.phone}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))), [query.data, search]);
  if (!user || !token) return <AccessScreen />;
  return <SafeAreaView style={ui.page}><FlatList
    contentContainerStyle={ui.content} data={filtered} keyExtractor={memberId}
    refreshing={query.loading} onRefresh={() => void query.reload()} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={{ gap: 18, marginBottom: 20 }}><Brand /><Link href="/account" style={ui.link}>← Tài khoản</Link><Text style={ui.title}>Danh sách hội viên</Text><Text style={ui.body}>{query.data?.length ?? 0} hồ sơ trên hệ thống</Text>{canManageMembers(user.role) && <Button title="+ Thêm hồ sơ hội viên" onPress={() => router.push('/members/edit')} />}<Field label="Tìm hội viên" placeholder="Tên hoặc số điện thoại" value={search} onChangeText={setSearch} /><QueryStatus loading={query.loading} error={query.error} retry={() => void query.reload()} /></View>}
    ListEmptyComponent={!query.loading && !query.error ? <Text style={ui.body}>{search ? 'Không có kết quả phù hợp.' : 'Chưa có hồ sơ hội viên.'}</Text> : null}
    ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
    renderItem={({ item }) => <View style={ui.card}><Text style={ui.heading}>{item.fullName}</Text><Text selectable style={ui.body}>{item.phone}</Text><Text style={ui.body}>{levelLabels[item.level] || item.level} · {item.goal || 'Chưa có mục tiêu'}</Text><Text selectable style={[ui.body, { fontSize: 11 }]}>Mã hồ sơ: {memberId(item)}</Text>{canManageMembers(user.role) && <Button secondary title="Chỉnh sửa hồ sơ" onPress={() => router.push({ pathname: '/members/edit', params: { id: memberId(item) } })} />}</View>}
  /></SafeAreaView>;
}
