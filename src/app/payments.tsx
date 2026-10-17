import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useApiQuery } from '@/hooks/use-api-query';
import { useActorProfile } from '@/hooks/use-actor-profile';
import { canManagePayments, currency, ownPayments, paymentMethods, paymentsApi, registrationFor } from '@/services/payments';
import { classRegistrationsApi, entityId, referenceLabel } from '@/services/operations';
import { ListPage } from '@/components/sport/list-page';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Button } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
export default function Payments() {
  const { user, token } = useAuth(); const member = user?.role === 'MEMBER'; const actor = useActorProfile(member); const actorId = actor.data ? entityId(actor.data) : '';
  const [filter, setFilter] = useState('ALL');
  const load = useCallback(async () => { const [items, registrations] = await Promise.all([paymentsApi.list(token!), classRegistrationsApi.list(token!)]); return { items: member ? ownPayments(items, registrations, actorId) : items, registrations }; }, [token, member, actorId]);
  const query = useApiQuery(load, !!token && canManagePayments(user?.role) && (!member || !!actorId), false);
  useFocusEffect(useCallback(() => { query.reload(); }, [query.reload]));
  if (!user || !token) return <AccessScreen />;
  if (!canManagePayments(user.role)) return <AccessScreen denied />;
  return <ListPage title={member ? 'Thanh toán của tôi' : 'Quản lý thanh toán'} description="Học phí được tính từ khóa học trên hệ thống. Trạng thái chỉ cập nhật khi backend xác nhận kết quả." items={(query.data?.items || []).filter(item => filter === 'ALL' || item.status === filter)} loading={query.loading || member && actor.loading} error={query.error} reload={query.reload} controls={<View style={{ gap: 12 }}><QueryStatus loading={member && actor.loading} error={member ? actor.error : null} retry={actor.reload} /><Button title="+ Tạo yêu cầu thanh toán" disabled={member && !actorId} onPress={() => router.push('/payment-edit')} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[['ALL', 'Tất cả'], ['PENDING', 'Chờ thanh toán'], ['SUCCESS', 'Thành công'], ['FAILED', 'Thất bại']].map(([key, label]) => <Button key={key} secondary={filter !== key} title={label} onPress={() => setFilter(key)} />)}</View></View>} renderItem={item => {
    const registration = registrationFor(item, query.data?.registrations || []);
    return <View style={ui.card}><Text style={ui.eyebrow}>{item.status === 'SUCCESS' ? '✓ ĐÃ THANH TOÁN' : item.status === 'FAILED' ? 'THANH TOÁN THẤT BẠI' : '◷ CHỜ THANH TOÁN'}</Text><Text style={ui.title}>{currency(item.amount)}</Text><Text style={ui.heading}>{referenceLabel(registration?.classId)}</Text>{!member && <Text style={ui.body}>{referenceLabel(registration?.memberId)}</Text>}<Text style={ui.body}>{paymentMethods.find(method => method.value === item.paymentMethod)?.label || String(item.paymentMethod || '')}</Text><Text style={ui.body}>{item.createdAt ? new Date(String(item.createdAt)).toLocaleString('vi-VN') : ''}</Text>{item.status === 'PENDING' && registration?.status !== 'CANCELLED' && <Button secondary title="Chi tiết & thanh toán →" onPress={() => router.push({ pathname: '/payment-edit', params: { id: entityId(item) } })} />}</View>;
  }} />;
}
