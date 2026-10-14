import { useCallback } from 'react';
import { Text } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import { membersApi, memberId } from '@/services/members';
import { canManageMembers } from '@/utils/permissions';
import { useApiQuery } from '@/hooks/use-api-query';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Brand, Screen } from '@/components/sport/ui';
import { MemberForm } from '@/components/sport/member-form';
import { ui } from '@/components/sport/styles';
export default function EditMember() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, token } = useAuth();
  const load = useCallback(() => membersApi.list(token!), [token]);
  const query = useApiQuery(load, !!token && canManageMembers(user?.role) && !!id);
  if (!user || !token) return <AccessScreen />;
  if (!canManageMembers(user.role)) return <AccessScreen denied />;
  const selected = query.data?.find(member => memberId(member) === id);
  return <Screen><Brand /><Link href="/members" style={ui.link}>← Danh sách hội viên</Link><Text style={ui.title}>{id ? 'Chỉnh sửa hội viên' : 'Thêm hồ sơ hội viên'}</Text>
    {id && <QueryStatus loading={query.loading} error={query.error} retry={() => void query.reload()} />}
    {id && !query.loading && !query.error && !selected && <Text style={ui.error}>Không tìm thấy hồ sơ. Có thể hồ sơ đã được xóa.</Text>}
    {(!id || selected) && <MemberForm key={id || 'new'} initial={selected} requireUserId={!id} requireGoal={false} onSave={(input, userId) => id ? membersApi.update(token, id, input) : membersApi.create(token, userId, input)} onSaved={() => router.dismissTo('/members')} />}
  </Screen>;
}
