import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { loadCoachAttendanceContext, coachAttendanceApi } from '@/services/coach-teaching';
import { attendancesApi, entityId, referenceId, referenceLabel, type Entity } from '@/services/operations';
import { useApiQuery } from '@/hooks/use-api-query';
import { useScheduleAttendances } from '@/hooks/use-schedule-attendances';
import { classSessions, attendanceMembers, dayOf } from '@/utils/coach-teaching';
import { bangkokDate } from '@/services/dashboard';
import { Button, Field } from './ui';
import { QueryStatus } from './access';
import { ui } from './styles';
export function CoachAttendanceForm({ token, initial, defaults, onSaved }: { token: string; initial?: Entity; defaults?: Record<string, string>; onSaved: () => void }) {
  const [classId, setClassId] = useState(referenceId(initial?.classId) || defaults?.classId || '');
  const [day, setDay] = useState(dayOf(initial?.date) || defaults?.date || bangkokDate(new Date()));
  const [scheduleId, setScheduleId] = useState(defaults?.scheduleId || '');
  const [memberId, setMemberId] = useState(referenceId(initial?.memberId));
  const [status, setStatus] = useState(String(initial?.status || 'PRESENT'));
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const pending = useRef(false);
  const load = useCallback(() => loadCoachAttendanceContext(token), [token]); const query = useApiQuery(load);
  const data = query.data; const selectedClass = data?.classes.find(item => entityId(item) === classId);
  const sessions = selectedClass ? classSessions(data?.schedules || [], classId, day) : [];
  const selected = initial ? sessions.find(item => referenceId(item.lessonId) === referenceId(initial.lessonId)) : sessions.find(item => entityId(item) === scheduleId) || (!scheduleId && sessions.length === 1 ? sessions[0] : undefined);
  const students = selectedClass ? attendanceMembers(data?.students || [], classId) : [];
  const selectedScheduleId = selected ? entityId(selected) : '';
  const records = useScheduleAttendances(token, selectedScheduleId);
  const existingRecord = records.data?.find(item => referenceId(item.memberId) === memberId);
  async function save() {
    if (pending.current) return; setError('');
    if (!selectedClass || !selected || !students.some(item => entityId(item) === memberId)) { setError('Chọn lớp, buổi học và học viên đã xác nhận của lớp đó.'); return; }
    pending.current = true; setBusy(true);
    try {
      const fresh = await loadCoachAttendanceContext(token);
      const current = fresh.schedules.find(item => entityId(item) === entityId(selected) && item.status !== 'CANCELLED' && dayOf(item.date) === day && referenceId(item.classId) === classId && referenceId(item.lessonId) === referenceId(selected.lessonId));
      if (!current || !attendanceMembers(fresh.students, classId).some(item => entityId(item) === memberId)) throw new Error('Lịch hoặc đăng ký hội viên đã thay đổi. Vui lòng tải lại buổi học.');
      if (initial) await attendancesApi.update(token, entityId(initial), { memberId, classId, lessonId: referenceId(current.lessonId), date: dayOf(current.date), status });
      else await coachAttendanceApi.create(token, memberId, entityId(current), status);
      onSaved();
    } catch (e) { setError((e as Error).message); } finally { pending.current = false; setBusy(false); }
  }
  return <View style={{ gap: 18 }}><Text style={ui.body}>Chọn lớp và ngày để xem lịch dạy. Bài học, giờ và phòng được lấy từ buổi học đã xếp, không chọn bài của môn khác.</Text><QueryStatus loading={query.loading} error={query.error} retry={query.reload} />{data && <>
    <View style={ui.card}><Text style={ui.heading}>Lớp tôi phụ trách</Text>{data.classes.map(item => <Button key={entityId(item)} secondary={classId !== entityId(item)} disabled={busy || !!initial} title={`${String(item.name)} · ${referenceLabel(item.subjectId)}`} onPress={() => { setClassId(entityId(item)); setDay(bangkokDate(new Date())); setScheduleId(''); setMemberId(''); }} />)}{!data.classes.length && <Text style={ui.body}>Bạn chưa được phân công lớp.</Text>}</View>
    {selectedClass && <><View style={ui.card}><Text style={ui.heading}>Lịch ngày {day}</Text><Field label="Ngày xem lịch (YYYY-MM-DD)" value={day} editable={!busy && !initial} onChangeText={value => { setDay(value); setScheduleId(''); }} /><Button secondary title="Hôm nay" disabled={busy || !!initial} onPress={() => { setDay(bangkokDate(new Date())); setScheduleId(''); }} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[...new Set(classSessions(data.schedules, classId).map(item => dayOf(item.date)))].map(value => <Button key={value} secondary={value !== day} disabled={busy || !!initial} title={value} onPress={() => { setDay(value); setScheduleId(''); }} />)}</View>{sessions.map(item => <View key={entityId(item)} style={{ gap: 6 }}><Button secondary={!selected || entityId(selected) !== entityId(item)} disabled={busy || !!initial} title={`${String(item.startTime)}–${String(item.endTime)} · ${referenceLabel(item.lessonId)}`} onPress={() => setScheduleId(entityId(item))} /><Text style={ui.body}>Phòng: {referenceLabel(item.roomId)}</Text></View>)}{!sessions.length && <Text style={ui.body}>Không có lịch dạy của lớp này vào ngày đã chọn.</Text>}</View>
    {selected && <><View style={ui.card}><Text style={ui.heading}>Buổi điểm danh</Text><Text style={ui.body}>{referenceLabel(selected.lessonId)}</Text><Text style={ui.body}>{dayOf(selected.date)} · {String(selected.startTime)}–{String(selected.endTime)} · Phòng {referenceLabel(selected.roomId)}</Text></View><View style={ui.card}><Text style={ui.heading}>Học viên của lớp</Text>{students.map(item => <Button key={entityId(item)} secondary={entityId(item) !== memberId} disabled={busy || !!initial} title={String(item.fullName || 'Chưa có tên')} onPress={() => setMemberId(entityId(item))} />)}{!students.length && <Text style={ui.body}>Chưa có học viên đã xác nhận trong lớp.</Text>}<QueryStatus loading={records.loading} error={records.error} retry={records.reload} />{existingRecord && !initial && <Text style={ui.body}>Học viên đã có điểm danh buổi này: {existingRecord.status === 'PRESENT' ? 'Có mặt' : 'Vắng mặt'}. Mở danh sách điểm danh để chỉnh sửa.</Text>}</View><View style={ui.card}><Text style={ui.heading}>Kết quả điểm danh</Text>{[['PRESENT', 'Có mặt'], ['ABSENT', 'Vắng mặt']].map(([value, label]) => <Button key={value} secondary={status !== value} disabled={busy} title={label} onPress={() => setStatus(value)} />)}<Button disabled={busy || !memberId || records.loading || !!records.error || !!existingRecord && !initial} title={busy ? 'Đang lưu…' : 'Lưu điểm danh'} onPress={() => void save()} /></View></>}
    </>}
  </>}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}</View>;
}
