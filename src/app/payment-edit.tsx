import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useApiQuery } from '@/hooks/use-api-query';
import { useActorProfile } from '@/hooks/use-actor-profile';
import { classRegistrationsApi, entityId, referenceId, referenceLabel, type Entity } from '@/services/operations';
import { canManagePayments, currency, ownPayments, pendingPaymentForRegistration, payableRegistrations, paymentMethods, paymentsApi, registrationFor, type PaymentMethod } from '@/services/payments';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { Screen, Button } from '@/components/sport/ui';
import { PaymentActions } from '@/components/sport/payment-actions';
import { FlowSteps } from '@/components/sport/flow-steps';
import { enrollmentSteps } from '@/utils/enrollment';
import { ui } from '@/components/sport/styles';
function PaymentForm({ token, item, registrations, selectedId, member, onRefresh }: { token: string; item?: Entity; registrations: Entity[]; selectedId?: string; member: boolean; onRefresh: () => void }) {
  const [registrationId, setRegistrationId] = useState(item ? referenceId(item.classRegistrationId) : selectedId || '');
  const [method, setMethod] = useState<PaymentMethod>((item?.paymentMethod as PaymentMethod) || 'ONLINE');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const pending = useRef(false);
  async function save() {
    if (pending.current) return;
    if (!item && !registrations.some(record => entityId(record) === registrationId)) { setError('Chọn đăng ký lớp đang chờ thanh toán.'); return; }
    pending.current = true; setBusy(true); setError('');
    try { if (item) await paymentsApi.update(token, entityId(item), method); else { const created = await paymentsApi.create(token, registrationId, method); const createdId = entityId(created); if (!createdId) throw new Error('Máy chủ chưa trả về mã yêu cầu thanh toán. Mở danh sách để kiểm tra trước khi tạo lại.'); router.replace({ pathname: '/payment-edit', params: { id: createdId } }); return; } onRefresh(); }
    catch (e) { setError((e as Error).message); } finally { pending.current = false; setBusy(false); }
  }
  return <View style={{ gap: 16 }}>{item ? <View style={ui.card}><Text style={ui.eyebrow}>SỐ TIỀN TỪ HỆ THỐNG</Text><Text style={ui.title}>{currency(item.amount)}</Text><Text style={ui.body}>Bạn chỉ có thể đổi phương thức khi yêu cầu còn chờ thanh toán.</Text></View> : <View style={ui.card}><Text style={ui.heading}>Chọn đăng ký lớp</Text>{registrations.length ? registrations.map(record => <Button key={entityId(record)} disabled={busy} secondary={registrationId !== entityId(record)} title={`${referenceLabel(record.classId)} · ${referenceLabel(record.memberId)}`} onPress={() => setRegistrationId(entityId(record))} />) : <Text style={ui.body}>Không có đăng ký chờ thanh toán. Đăng ký lớp trước hoặc kiểm tra yêu cầu thanh toán đã tạo.</Text>}</View>}<View style={ui.card}><Text style={ui.heading}>Phương thức thanh toán</Text>{paymentMethods.map(option => <Button key={option.value} disabled={busy} secondary={option.value !== method} title={option.label} onPress={() => setMethod(option.value)} />)}<Text style={ui.body}>Tạo yêu cầu chưa trừ tiền và chưa xác nhận đăng ký. Số tiền được BE lấy từ học phí khóa học; tiền mặt/chuyển khoản cần trung tâm hướng dẫn xác nhận.</Text>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button disabled={busy || !item && !registrations.length} title={busy ? 'Đang lưu…' : item ? 'Lưu phương thức' : 'Tạo yêu cầu thanh toán'} onPress={() => void save()} /></View>{member && item && <>{method !== item.paymentMethod && <Text style={ui.body}>Lưu phương thức mới trước khi mở thanh toán.</Text>}<PaymentActions key={`${entityId(item)}:${item.paymentMethod}`} item={item} token={token} onRefresh={onRefresh} disabled={busy || method !== item.paymentMethod} onBusyChange={setBusy} /></>}</View>;
}
export default function PaymentEditor() {
  const { id, registrationId } = useLocalSearchParams<{ id?: string; registrationId?: string }>(); const { user, token } = useAuth(); const member = user?.role === 'MEMBER';
  const actor = useActorProfile(member); const actorId = actor.data ? entityId(actor.data) : '';
  const load = useCallback(async () => { const [payments, registrations] = await Promise.all([paymentsApi.list(token!), classRegistrationsApi.list(token!)]); const visible = member ? registrations.filter(record => referenceId(record.memberId) === actorId) : registrations; return { payments: member ? ownPayments(payments, registrations, actorId) : payments, registrations: visible }; }, [token, member, actorId]);
  const query = useApiQuery(load, !!token && canManagePayments(user?.role) && (!member || !!actorId));
  const { reload } = query;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  if (!user || !token) return <AccessScreen />;
  if (!canManagePayments(user.role)) return <AccessScreen denied />;
  const existing = query.data?.payments.find(record => !!registrationId && record.status === 'SUCCESS' && referenceId(record.classRegistrationId) === registrationId) || pendingPaymentForRegistration(query.data?.payments || [], registrationId);
  const selectedPaymentId = id || (existing ? entityId(existing) : undefined);
  const item = query.data?.payments.find(record => entityId(record) === selectedPaymentId);
  const registration = item ? registrationFor(item, query.data?.registrations || []) : undefined;
  const alreadyPaid = !!item && query.data?.payments.some(record => record.status === 'SUCCESS' && referenceId(record.classRegistrationId) === referenceId(item.classRegistrationId));
  const eligible = payableRegistrations(query.data?.registrations || [], query.data?.payments || []);
  return <Screen><Link href="/payments" style={ui.link}>← Thanh toán</Link><FlowSteps labels={enrollmentSteps} current={4} /><Text style={ui.title}>{selectedPaymentId ? 'Chi tiết thanh toán' : 'Yêu cầu thanh toán'}</Text><QueryStatus loading={query.loading || member && actor.loading} error={query.error || (member ? actor.error : null)} retry={() => { query.reload(); actor.reload(); }} />{member && actor.error && <Link href="/profile" style={ui.link}>Hoàn thiện hồ sơ hội viên →</Link>}{query.data && (selectedPaymentId && !item ? <Text style={ui.error}>Không tìm thấy thanh toán thuộc tài khoản này.</Text> : item && (item.status !== 'PENDING' || registration?.status === 'CANCELLED' || alreadyPaid) ? <View style={ui.card}><Text style={ui.heading}>{alreadyPaid ? 'Đăng ký đã có thanh toán thành công' : item.status === 'FAILED' ? 'Thanh toán chưa thành công' : 'Đăng ký không còn chờ thanh toán'}</Text><Text style={ui.body}>{currency(item.amount)} · {referenceLabel(registration?.classId)}</Text>{registration && <Button title={registration.status === 'CONFIRMED' ? 'Xem đăng ký và lịch học →' : 'Quay lại đăng ký để tiếp tục →'} onPress={() => router.push({ pathname: '/registration-detail', params: { id: entityId(registration) } })} />}</View> : <PaymentForm key={selectedPaymentId || 'new'} token={token} item={item} registrations={eligible} selectedId={registrationId} member={member && registration?.status === 'PENDING_PAYMENT'} onRefresh={reload} />)}</Screen>;
}
