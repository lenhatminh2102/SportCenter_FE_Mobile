import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { membersApi } from '@/services/members';
import { useApiQuery } from '@/hooks/use-api-query';
import { Button, Screen } from '@/components/sport/ui';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { MemberForm } from '@/components/sport/member-form';
import { ui } from '@/components/sport/styles';
export default function Profile() {
  const { user, token } = useAuth();
  const [saved, setSaved] = useState(false);
  const load = useCallback(() => membersApi.me(token!), [token]);
  const query = useApiQuery(load, !!token && user?.role === 'MEMBER');
  if (!user || !token) return <AccessScreen />;
  if (user.role !== 'MEMBER') return <AccessScreen denied />;
  return <Screen><Link href="/member" style={ui.link}>← Trang chủ của tôi</Link><Text style={ui.title}>{query.missing ? 'Tạo hồ sơ hội viên' : 'Hồ sơ của tôi'}</Text><Text style={ui.body}>Thông tin này được lưu trực tiếp trên SportCenter.</Text>{saved && <Text accessibilityRole="alert" style={{ color: '#15803d' }}>Đã lưu hồ sơ thành công.</Text>}{saved && <Button title="Tiếp tục tới trang chủ →" onPress={() => router.replace('/member')} />}
    <QueryStatus loading={query.loading} error={query.missing ? null : query.error} retry={() => { setSaved(false); void query.reload(); }} />
    {!query.loading && (query.data || query.missing) && <MemberForm key={query.data?.updatedAt || (query.missing ? 'new' : 'existing')} initial={query.data || undefined} onSave={input => query.missing ? membersApi.createMe(token, input) : membersApi.updateMe(token, input)} onSaved={() => { setSaved(true); void query.reload(); }} />}
  </Screen>;
}
