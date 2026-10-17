import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useApiQuery } from '@/hooks/use-api-query';
import { ApiError } from '@/services/api';
import { classesApi, coursesApi, schedulesApi, classRegistrationsApi, entityId, referenceId, referenceLabel, type Entity } from '@/services/operations';
import { membersApi, type MemberProfile } from '@/services/members';
import { ScheduleChangedError, saveEnrollment } from '@/services/enrollment';
import { currency } from '@/services/payments';
import { enrollmentSteps, enrollmentRoles, enrollmentFor, enrollmentConflicts, upcomingClassSchedules, scheduleSignature } from '@/utils/enrollment';
import { Screen, Button, Check } from '@/components/sport/ui';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { MemberForm } from '@/components/sport/member-form';
import { RelationField } from '@/components/sport/relation-field';
import { FlowSteps } from '@/components/sport/flow-steps';
import { ui } from '@/components/sport/styles';
function EnrollmentFlow({ initialClassId }: { initialClassId?: string }) {
  const { user, token } = useAuth(); const member = user?.role === 'MEMBER';
  const [classId, setClassId] = useState(initialClassId || '');
  const [step, setStep] = useState(initialClassId ? 1 : 0);
  const [agreed, setAgreed] = useState(false); const [confirmedSchedule, setConfirmedSchedule] = useState('');
  const [savedProfile, setSavedProfile] = useState<MemberProfile | null>(null); const [selectedMember, setSelectedMember] = useState<Entity | null>(null); const [editingProfile, setEditingProfile] = useState(false);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const pending = useRef(false);
  const load = useCallback(async () => {
    const [classes, courses, schedules, registrations, profile] = await Promise.all([
      classesApi.list(token!), coursesApi.list(token!), schedulesApi.list(token!), classRegistrationsApi.list(token!),
      member ? membersApi.me(token!).catch(error => { if (error instanceof ApiError && error.status === 404) return null; throw error; }) : Promise.resolve(null),
    ]);
    return { classes, courses, schedules, registrations, profile };
  }, [token, member]);
  const query = useApiQuery(load, !!token && enrollmentRoles.includes(user?.role || ''));
  if (!user || !token) return <AccessScreen />;
  if (!enrollmentRoles.includes(user.role)) return <AccessScreen denied />;
  const data = query.data;
  const selected = data?.classes.find(item => entityId(item) === classId);
  const course = data?.courses.find(item => entityId(item) === referenceId(selected?.courseId));
  const sessions = upcomingClassSchedules(data?.schedules || [], classId);
  const profile = member ? savedProfile || data?.profile : selectedMember;
  const memberId = profile ? entityId(profile) : '';
  const existing = data && memberId ? enrollmentFor(data.registrations, classId, memberId) : undefined;
  const conflicts = data && memberId ? enrollmentConflicts(data.schedules, data.registrations, classId, memberId) : [];
  const ready = !!selected && course?.status === 'ACTIVE' && typeof course.price === 'number' && course.price > 0 && sessions.length > 0;
  const chooseClass = (value: string) => { setClassId(value); setAgreed(false); setConfirmedSchedule(''); setError(''); setStep(1); };
  async function submit() {
    if (pending.current || !profile || !confirmedSchedule) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const registration = await saveEnrollment(token!, { classId, memberId, confirmedSchedule });
      if (!entityId(registration)) throw new Error('Chưa nhận được mã đăng ký. Mở danh sách đăng ký để kiểm tra trước khi thử lại.');
      router.replace({ pathname: '/payment-edit', params: { registrationId: entityId(registration) } });
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ScheduleChangedError) { setStep(1); setAgreed(false); setConfirmedSchedule(''); query.reload(); }
    } finally { pending.current = false; setBusy(false); }
  }
  return <Screen>
    <Link href={{ pathname: '/workspace/[resource]', params: { resource: 'classes' } }} style={ui.link}>← Danh sách lớp</Link>
    <Text style={ui.eyebrow}>{member ? 'ĐĂNG KÝ LỚP CỦA BẠN' : 'ĐĂNG KÝ LỚP CHO HỘI VIÊN'}</Text>
    <Text style={ui.title}>{enrollmentSteps[step]}</Text><FlowSteps labels={enrollmentSteps} current={step} />
    <QueryStatus loading={query.loading} error={query.error} retry={query.reload} />
    {data && step === 0 && <><Text style={ui.body}>Chọn lớp phù hợp rồi kiểm tra toàn bộ lịch học trước khi đăng ký.</Text>{data.classes.map(item => <View key={entityId(item)} style={ui.card}><Text style={ui.heading}>{String(item.name || '')}</Text><Text style={ui.body}>{referenceLabel(item.subjectId)} · Coach {referenceLabel(item.coachId)}</Text><Button title="Chọn lớp và xem lịch →" onPress={() => chooseClass(entityId(item))} /></View>)}{!data.classes.length && <Text style={ui.body}>Trung tâm chưa có lớp học.</Text>}</>}
    {data && step > 0 && !selected && <><Text style={ui.error}>Lớp không còn tồn tại.</Text><Button secondary title="Chọn lớp khác" onPress={() => setStep(0)} /></>}
    {data && selected && step > 0 && <>
      <View style={ui.card}><Text style={ui.heading}>{String(selected.name)}</Text><Text style={ui.body}>Coach: {referenceLabel(selected.coachId)}</Text><Text style={ui.body}>Khóa học: {referenceLabel(selected.courseId)}</Text><Text style={ui.heading}>{currency(course?.price)}</Text></View>
      {step === 1 && <>
        <Text style={ui.body}>Bạn đăng ký toàn bộ lớp theo lịch dưới đây. Chọn lớp khác nếu thời gian chưa phù hợp; hiện chưa hỗ trợ đặt một buổi riêng.</Text>
        {sessions.map(item => <View key={entityId(item)} style={ui.card}><Text style={ui.heading}>{String(item.date).slice(0, 10)} · {String(item.startTime)}–{String(item.endTime)}</Text><Text style={ui.body}>{referenceLabel(item.lessonId)} · Phòng {referenceLabel(item.roomId)}</Text></View>)}
        {!sessions.length && <Text style={ui.error}>Lớp chưa có buổi học sắp tới. Vui lòng chọn lớp khác hoặc liên hệ trung tâm.</Text>}
        {(course?.status !== 'ACTIVE' || typeof course?.price !== 'number' || course.price <= 0) && <Text style={ui.error}>Khóa học chưa mở hoặc chưa có học phí để thanh toán.</Text>}
        <Check checked={agreed} onPress={() => setAgreed(value => !value)} label="Tôi đã xem và có thể tham gia lịch của lớp." />
        <Button disabled={!ready || !agreed} title="Tiếp tục: thông tin hội viên →" onPress={() => { setConfirmedSchedule(scheduleSignature(sessions)); setStep(2); }} />
        <Button secondary title="Chọn lớp khác" onPress={() => setStep(0)} />
      </>}
      {step === 2 && <>
        {member ? <>
          <Text style={ui.body}>Thông tin hồ sơ được lưu vào tài khoản của bạn, không cần nhập lại ở bước thanh toán.</Text>
          {(!profile || editingProfile) ? <MemberForm initial={savedProfile || data?.profile || undefined} onSave={async input => { const value = profile ? await membersApi.updateMe(token, input) : await membersApi.createMe(token, input); setSavedProfile(value); }} onSaved={() => setEditingProfile(false)} /> : <View style={ui.card}><Text style={ui.heading}>{String(profile.fullName)}</Text><Text style={ui.body}>{String(profile.phone || '')}</Text><Text style={ui.body}>Mục tiêu: {String(profile.goal || 'Chưa cập nhật')}</Text><Button secondary title="Chỉnh sửa thông tin" onPress={() => setEditingProfile(true)} /></View>}
        </> : <><Text style={ui.body}>Chọn hồ sơ của hội viên được hỗ trợ. Không dùng tài khoản nhân viên để đăng ký thay cho hội viên.</Text><RelationField label="Hội viên tham gia lớp" path="/api/members" token={token} value={memberId} initialLabel={profile ? String(profile.fullName || '') : undefined} onChange={() => {}} disabled={busy} onSelect={setSelectedMember} />{profile && <Text style={ui.body}>{String(profile.fullName)} · {String(profile.phone || '')}</Text>}<Link href="/members/edit" style={ui.link}>Tạo hồ sơ cho hội viên đã có tài khoản →</Link></>}
        {!!conflicts.length && <Text style={ui.error}>Lịch này trùng với lớp đã xác nhận của hội viên. Quay lại để chọn lớp khác.</Text>}
        {existing ? <View style={ui.card}><Text style={ui.body}>Hội viên đã có đăng ký lớp này. Tiếp tục từ đăng ký hiện có.</Text><Button title="Mở đăng ký hiện có →" onPress={() => router.replace({ pathname: '/registration-detail', params: { id: entityId(existing) } })} /></View> : <Button disabled={!memberId || editingProfile || !!conflicts.length} title="Tiếp tục: kiểm tra đăng ký →" onPress={() => setStep(3)} />}
        <Button secondary title="← Xem lại lịch lớp" onPress={() => setStep(1)} />
      </>}
      {step === 3 && profile && <>
        <View style={ui.card}><Text style={ui.heading}>Kiểm tra trước khi lưu</Text><Text style={ui.body}>Hội viên: {String(profile.fullName)} · {String(profile.phone || '')}</Text><Text style={ui.body}>{sessions.length} buổi sắp tới theo lịch của lớp.</Text><Text style={ui.body}>Học phí khóa học: {currency(course?.price)}. Số tiền thanh toán cuối cùng được lấy từ hệ thống.</Text><Text style={ui.body}>Lưu đăng ký tạo trạng thái chờ thanh toán. Chỉ sau khi BE xác nhận thanh toán, lịch mới xuất hiện trong “Lịch của tôi”.</Text></View>
        <Button disabled={busy || !ready} title={busy ? 'Đang lưu đăng ký…' : 'Lưu đăng ký và đến thanh toán →'} onPress={() => void submit()} />
        <Button secondary disabled={busy} title="← Sửa thông tin" onPress={() => setStep(2)} />
      </>}
    </>}
    {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
  </Screen>;
}
export default function Enroll() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  return <EnrollmentFlow key={classId || 'new'} initialClassId={classId} />;
}
