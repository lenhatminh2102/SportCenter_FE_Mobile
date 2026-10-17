import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useApiQuery } from '@/hooks/use-api-query';
import { useActorProfile } from '@/hooks/use-actor-profile';
import { classRegistrationsApi, entityId, referenceId, referenceLabel, type Entity } from '@/services/operations';
import { canManagePayments, currency, ownPayments, paymentMethods, paymentsApi, registrationFor, type PaymentMethod } from '@/services/payments';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Screen, Button } from '@/components/sport/ui';
import { PaymentActions } from '@/components/sport/payment-actions';
import { ui } from '@/components/sport/styles';
function PaymentForm({ token, item, registrations, selectedId }: { token: string; item?: Entity; registrations: Entity[]; selectedId?: string }) {
  const [registrationId, setRegistrationId] = useState(item ? referenceId(item.classRegistrationId) : selectedId || '');
  const [method, setMethod] = useState<PaymentMethod>((item?.paymentMethod as PaymentMethod) || 'ONLINE');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const pending = useRef(false);
  async function save() {
    if (pending.current) return;
    if (!item && !registrations.some(record => entityId(record) === registrationId)) { setError('Chọn đăng ký lớp đang chờ thanh toán.'); return; }
    pending.current = true; setBusy(true); setError('');
    try { if (item) await paymentsApi.update(token, entityId(item), method); else await paymentsApi.create(token, registrationId, method); router.dismissTo('/payments'); }
    catch (e) { setError((e as Error).message); } finally { pending.current = false; setBusy(false); }
  }
  return <View style={{ gap: 16 }}>{item ? <View style={ui.card}><Text style={ui.eyebrow}>SỐ TIỀN TỪ HỆ THỐNG</Text><Text style={ui.title}>{currency(item.amount)}</Text><Text style={ui.body}>Bạn chỉ có thể đổi phương thức khi yêu cầu còn chờ thanh toán.</Text></View> : <View style={ui.card}><Text style={ui.heading}>Chọn đăng ký lớp</Text>{registrations.length ? registrations.map(record => <Button key={entityId(record)} disabled={busy} secondary={registrationId !== entityId(record)} title={`${referenceLabel(record.classId)} · ${referenceLabel(record.memberId)}`} onPress={() => setRegistrationId(entityId(record))} />) : <Text style={ui.body}>Không có đăng ký chờ thanh toán. Đăng ký lớp trước hoặc kiểm tra yêu cầu thanh toán đã tạo.</Text>}</View>}<View style={ui.card}><Text style={ui.heading}>Phương thức thanh toán</Text>{paymentMethods.map(option => <Button key={option.value} disabled={busy} secondary={option.value !== method} title={option.label} onPress={() => setMethod(option.value)} />)}<Text style={ui.body}>Tạo yêu cầu chưa trừ tiền và chưa xác nhận đăng ký. Số tiền được BE lấy từ học phí khóa học; tiền mặt/chuyển khoản cần trung tâm hướng dẫn xác nhận.</Text>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button disabled={busy || !item && !registrations.length} title={busy ? 'Đang lưu…' : item ? 'Lưu phương thức' : 'Tạo yêu cầu thanh toán'} onPress={() => void save()} /></View></View>;
}
export default function PaymentEditor() {
  const { id, registrationId } = useLocalSearchParams<{ id?: string; registrationId?: string }>(); const { user, token } = useAuth(); const member = user?.role === 'MEMBER';
  const actor = useActorProfile(member); const actorId = actor.data ? entityId(actor.data) : '';
  const load = useCallback(async () => { const [payments, registrations] = await Promise.all([paymentsApi.list(token!), classRegistrationsApi.list(token!)]); const visible = member ? registrations.filter(record => referenceId(record.memberId) === actorId) : registrations; return { payments: member ? ownPayments(payments, registrations, actorId) : payments, registrations: visible }; }, [token, member, actorId]);
  const query = useApiQuery(load, !!token && canManagePayments(user?.role) && (!member || !!actorId));
  useFocusEffect(useCallback(() => { query.reload(); }, [query.reload]));
  if (!user || !token) return <AccessScreen />;
  if (!canManagePayments(user.role)) return <AccessScreen denied />;
  const item = query.data?.payments.find(record => entityId(record) === id);
  const registration = item ? registrationFor(item, query.data?.registrations || []) : undefined;
  const eligible = (query.data?.registrations || []).filter(record => record.status === 'PENDING_PAYMENT' && !query.data?.payments.some(payment => referenceId(payment.classRegistrationId) === entityId(record) && ['PENDING', 'SUCCESS'].includes(String(payment.status))));
  return <Screen><Link href="/payments" style={ui.link}>← Thanh toán</Link><Text style={ui.title}>{id ? 'Chi tiết thanh toán' : 'Yêu cầu thanh toán'}</Text><QueryStatus loading={query.loading || member && actor.loading} error={query.error || (member ? actor.error : null)} retry={() => { query.reload(); actor.reload(); }} />{member && actor.error && <Link href="/profile" style={ui.link}>Hoàn thiện hồ sơ hội viên →</Link>}{query.data && (id && !item ? <Text style={ui.error}>Không tìm thấy thanh toán thuộc tài khoản này.</Text> : item && (item.status !== 'PENDING' || registration?.status === 'CANCELLED') ? <Text style={ui.body}>Yêu cầu này không còn cho phép chỉnh sửa. Quay lại danh sách để xem trạng thái mới nhất.</Text> : <PaymentForm key={id || 'new'} token={token} item={item} registrations={eligible} selectedId={registrationId} />)}{member && item?.status === 'PENDING' && registration?.status === 'PENDING_PAYMENT' && <PaymentActions key={entityId(item)} token={token} item={item} onRefresh={query.reload} />}</Screen>;
}
