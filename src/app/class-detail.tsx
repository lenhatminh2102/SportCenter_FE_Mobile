import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Button, Screen } from '@/components/sport/ui';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { ui } from '@/components/sport/styles';
import { classesApi, entityId, referenceLabel } from '@/services/operations';
import { useApiQuery } from '@/hooks/use-api-query';
import { useAuth } from '@/context/auth';
export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const { user, token } = useAuth();
  const load = useCallback(() => classesApi.list(token!), [token]); const query = useApiQuery(load, !!token);
  if (!user || !token) return <AccessScreen />;
  const item = query.data?.find(record => entityId(record) === id);
  return <Screen><Link href={{ pathname: '/workspace/[resource]', params: { resource: 'classes' } }} style={ui.link}>← Lớp học</Link><QueryStatus loading={query.loading} error={query.error} retry={query.reload} />{item ? <View style={ui.card}><Text style={ui.eyebrow}>{referenceLabel(item.subjectId)}</Text><Text style={ui.title}>{String(item.name || '')}</Text><Text style={ui.body}>Khóa học: {referenceLabel(item.courseId)}</Text><Text style={ui.body}>Huấn luyện viên: {referenceLabel(item.coachId)}</Text><Text style={ui.body}>Đăng ký mới sẽ chờ thanh toán; trung tâm xác nhận sau khi hoàn tất học phí.</Text>{['MEMBER', 'RECEPTIONIST', 'CENTER_MANAGER'].includes(user.role) && <Button title="Chọn lớp và kiểm tra lịch →" onPress={() => router.push({ pathname: '/enroll', params: { classId: entityId(item) } })} />}<Button secondary title="Xem lịch lớp" onPress={() => router.push({ pathname: '/workspace/[resource]', params: { resource: 'schedules', classId: entityId(item) } })} /></View> : !query.loading && !query.error && <Text style={ui.body}>Không tìm thấy lớp học. Chọn lớp từ danh sách hiện tại.</Text>}</Screen>;
}
