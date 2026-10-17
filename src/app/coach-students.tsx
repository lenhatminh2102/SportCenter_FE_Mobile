import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { coachesApi, entityId, referenceLabel, type Entity } from '@/services/operations';
import { useApiQuery } from '@/hooks/use-api-query';
import { AccessScreen } from '@/components/sport/access';
import { ListPage } from '@/components/sport/list-page';
import { ui } from '@/components/sport/styles';
export default function CoachStudents() {
  const { user, token } = useAuth();
  const load = useCallback(async () => (await coachesApi.myStudents(token!)).map(item => ({ ...item, id: `${typeof item.member === 'object' && item.member ? entityId(item.member as Entity) : ''}:${typeof item.class === 'object' && item.class ? entityId(item.class as Entity) : ''}` })), [token]);
  const query = useApiQuery(load, !!token && user?.role === 'COACH', false); const { reload } = query;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  if (!user || !token) return <AccessScreen />;
  if (user.role !== 'COACH') return <AccessScreen denied />;
  return <ListPage title="Học viên của tôi" description="Hội viên đã được xác nhận trong các lớp bạn phụ trách, lấy từ API dành riêng cho coach." items={query.data || []} loading={query.loading} error={query.error} reload={reload} renderItem={item => <View style={ui.card}><Text style={ui.heading}>{referenceLabel(item.member)}</Text><Text style={ui.body}>Lớp: {referenceLabel(item.class)}</Text><Text style={ui.body}>{item.member && typeof item.member === 'object' ? String((item.member as Entity).phone || '') : ''}</Text><Text style={ui.eyebrow}>✓ ĐĂNG KÝ ĐÃ XÁC NHẬN</Text></View>} />;
}
