import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useActorProfile } from '@/hooks/use-actor-profile';
import { useApiQuery } from '@/hooks/use-api-query';
import { classRegistrationsApi, classesApi, entityId, referenceId, referenceLabel } from '@/services/operations';
import { paymentsApi, pendingPaymentForRegistration, currency } from '@/services/payments';
import { enrollmentRoles } from '@/utils/enrollment';
import { roleHome } from '@/utils/staff-navigation';
import { Screen, Button } from '@/components/sport/ui';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { CancelRegistration } from '@/components/sport/cancel-registration';
import { ui } from '@/components/sport/styles';
export default function RegistrationDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const { user, token } = useAuth(); const member = user?.role === 'MEMBER';
  const actor = useActorProfile(member); const actorId = actor.data ? entityId(actor.data) : '';
  const load = useCallback(async () => {
    const [registrations, classes, payments] = await Promise.all([classRegistrationsApi.list(token!), classesApi.list(token!), paymentsApi.list(token!)]);
    const registration = registrations.find(item => entityId(item) === id && (!member || referenceId(item.memberId) === actorId));
    return { registration, classInfo: classes.find(item => entityId(item) === referenceId(registration?.classId)), payments: payments.filter(item => referenceId(item.classRegistrationId) === id) };
  }, [token, id, member, actorId]);
  const query = useApiQuery(load, !!token && enrollmentRoles.includes(user?.role || '') && (!member || !!actorId), false); const { reload } = query;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  if (!user || !token) return <AccessScreen />;
  if (!enrollmentRoles.includes(user.role)) return <AccessScreen denied />;
  const item = query.data?.registration; const paid = query.data?.payments.some(record => record.status === 'SUCCESS'); const payment = pendingPaymentForRegistration(query.data?.payments || [], id);
  return <Screen><Link href={{ pathname: '/workspace/[resource]', params: { resource: 'class-registrations' } }} style={ui.link}>← {member ? 'Đăng ký của tôi' : 'Danh sách đăng ký'}</Link><Text style={ui.title}>Thông tin đăng ký</Text><QueryStatus loading={query.loading || member && actor.loading} error={query.error || (member ? actor.error : null)} retry={() => { actor.reload(); reload(); }} />{query.data && !item && <Text style={ui.error}>Không tìm thấy đăng ký trong phạm vi tài khoản.</Text>}{item && <>
    <View style={ui.card}><Text style={ui.eyebrow}>{item.status === 'CONFIRMED' ? '✓ ĐÃ XÁC NHẬN' : item.status === 'CANCELLED' ? 'ĐÃ HỦY' : 'CHỜ THANH TOÁN'}</Text><Text style={ui.heading}>{query.data?.classInfo ? String(query.data.classInfo.name) : referenceLabel(item.classId)}</Text><Text style={ui.body}>Hội viên: {referenceLabel(item.memberId)}</Text><Text style={ui.body}>Đăng ký: {String(item.registeredAt || item.createdAt || '').slice(0, 10)}</Text>{payment && <Text style={ui.heading}>Chờ thanh toán: {currency(payment.amount)}</Text>}</View>
    {item.status === 'PENDING_PAYMENT' && paid && <View style={ui.card}><Text style={ui.body}>Đã có giao dịch thành công. Đang chờ đồng bộ trạng thái đăng ký; không tạo thanh toán mới. Làm mới hoặc liên hệ trung tâm.</Text><Button secondary title="Kiểm tra lại" onPress={reload} /></View>}{item.status === 'PENDING_PAYMENT' && !paid && <><Text style={ui.body}>Đăng ký đã lưu. Tiếp tục thanh toán để xác nhận tham gia lớp; không tạo lại đăng ký.</Text><Button title={payment ? 'Tiếp tục thanh toán →' : 'Chọn phương thức thanh toán →'} onPress={() => router.push({ pathname: '/payment-edit', params: { registrationId: entityId(item) } })} /><CancelRegistration item={item} token={token} onCancelled={reload} /></>}
    {item.status === 'CONFIRMED' && <><Text style={ui.body}>Hội viên đã được xác nhận trong lớp. Xem lịch học và theo dõi buổi tập tiếp theo.</Text><Button title={member ? 'Xem lịch học của tôi →' : 'Xem lịch lớp →'} onPress={() => router.push({ pathname: '/workspace/[resource]', params: { resource: 'schedules', classId: referenceId(item.classId) } })} /><Text style={ui.body}>Muốn đổi hoặc hủy lớp đã thanh toán, liên hệ trung tâm để xử lý quyền lợi và học phí.</Text>{member && <Button secondary title="Gửi yêu cầu hỗ trợ" onPress={() => router.push('/support')} />}</>}
    {item.status === 'CANCELLED' && <><Text style={ui.body}>Đăng ký đã hủy. API hiện chưa hỗ trợ đăng ký lại cùng lớp; liên hệ trung tâm để được hỗ trợ.</Text><Button secondary title="Khám phá lớp khác" onPress={() => router.push('/enroll')} /></>}
    {query.data?.payments.map(record => <View key={entityId(record)} style={ui.card}><Text style={ui.heading}>{currency(record.amount)}</Text><Text style={ui.body}>{record.status === 'SUCCESS' ? 'Thanh toán thành công' : record.status === 'FAILED' ? 'Thanh toán thất bại' : 'Chờ thanh toán'}</Text></View>)}
  </>}<Button secondary title="Về không gian của tôi" onPress={() => router.navigate(roleHome(user.role))} /></Screen>;
}
