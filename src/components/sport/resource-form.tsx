import { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Field } from './ui';
import { RelationField } from './relation-field';
import { ui } from './styles';
import { colors } from '@/data/sport';
import { initialValues, resources, validateResource } from '@/utils/resources';
import { classesApi, coachesApi, lessonsApi, learningPathsApi, referenceId, referenceLabel, type Entity, type ResourceInput, type ResourceKey } from '@/services/operations';
import { useApiQuery } from '@/hooks/use-api-query';
import { QueryStatus } from './access';
import { loadTeachingScope } from '@/services/coach-teaching';
import { scopeTeachingResources } from '@/utils/coach-teaching';
import { assertCoachAssignment } from '@/utils/role-workflows';
export function ResourceForm({ resource, initial, token, userId, role, actorId, defaults, onSave, onSaved }: {
  resource: ResourceKey; initial?: Entity; token: string; userId: string; role?: string; actorId?: string; defaults?: Record<string, string>;
  onSave: (input: ResourceInput) => Promise<unknown>; onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...initialValues(resource, initial), ...defaults, ...(role === 'MEMBER' && actorId ? { memberId: actorId } : {}), ...(role === 'COACH' && resource === 'workout-plans' && actorId ? { coachId: actorId } : {}), ...(resource === 'activity-logs' ? { userId } : {}) }));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const scopeLoad = useCallback(() => loadTeachingScope(token, actorId || ''), [token, actorId]);
  const teaching = useApiQuery(scopeLoad, role === 'COACH' && resource === 'lesson-progress');
  const result = validateResource(resource, values, !!initial);
  const change = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));
  async function save() {
    if (pending.current) return;
    setSubmitted(true); setError('');
    if (Object.keys(result.errors).length) return;
    pending.current = true; setBusy(true);
    try {
      if (role === 'COACH' && ['attendances', 'lesson-progress', 'workout-plans'].includes(resource) && (resource !== 'workout-plans' || !initial || values.memberId !== referenceId(initial.memberId) || values.classId !== referenceId(initial.classId))) {
        const [classes, students] = await Promise.all([classesApi.list(token), coachesApi.myStudents(token)]);
        assertCoachAssignment(values, actorId || '', classes, students);
        if (resource === 'lesson-progress') {
          const [lessons, paths] = await Promise.all([lessonsApi.list(token), learningPathsApi.list(token)]);
          const ownClasses = classes.filter(item => referenceId(item.coachId) === actorId);
          if (!scopeTeachingResources('lessons', lessons, ownClasses, paths).some(item => referenceId(item) === values.lessonId)) throw new Error('Chọn bài học thuộc khóa học bạn phụ trách.');
        }
      }
      await onSave(result.payload); onSaved();
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được dữ liệu.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <View style={ui.card}>{role === 'COACH' && resource === 'lesson-progress' && <QueryStatus loading={teaching.loading} error={teaching.error} retry={teaching.reload} />}{resources[resource].fields.filter(field => (!initial || !field.createOnly) && (initial || !field.updateOnly)).map(field => {
    const fieldError = submitted ? result.errors[field.key] : undefined;
    const locked = role === 'MEMBER' && field.key === 'memberId' || role === 'COACH' && resource === 'workout-plans' && field.key === 'coachId' || resource === 'workout-results' && field.key === 'memberId';
    if (locked) return <View key={field.key} style={{ gap: 6 }}><Text style={ui.heading}>{field.label}</Text><Text style={ui.body}>{field.key === 'memberId' && resource === 'workout-results' ? 'Hội viên được lấy từ kế hoạch tập đã chọn.' : 'Hồ sơ của tài khoản đang đăng nhập.'}</Text>{!!fieldError && <Text style={ui.error}>{fieldError}</Text>}</View>;
    if (field.relation) return <RelationField key={field.key} label={field.label} path={role === 'COACH' && field.key === 'memberId' ? '/api/coaches/my-students' : field.relation} transformItems={role === 'COACH' && field.key === 'memberId' ? rows => { const students = rows.filter(row => !values.classId || referenceId(row.class) === values.classId).map(row => row.member).filter((item): item is Entity => !!item && typeof item === 'object'); return students.filter((item, index) => students.findIndex(other => referenceId(other) === referenceId(item)) === index); } : undefined} token={token} value={values[field.key]} initialLabel={initial?.[field.key] && typeof initial[field.key] === 'object' ? referenceLabel(initial[field.key]) : undefined} onChange={value => change(field.key, value)} disabled={busy || role === 'COACH' && field.key === 'lessonId' && !teaching.data} error={fieldError} optional={!field.required} filter={role === 'COACH' && field.key === 'lessonId' ? item => !!teaching.data && scopeTeachingResources('lessons', [item], teaching.data.classes, teaching.data.paths).length > 0 : role === 'COACH' && field.key === 'classId' ? item => referenceId(item.coachId) === actorId : field.key === 'roomId' ? item => item.status === 'ACTIVE' || referenceId(item) === values.roomId : field.key === 'workoutPlanId' ? item => role === 'MEMBER' ? referenceId(item.memberId) === actorId : role === 'COACH' ? referenceId(item.coachId) === actorId : true : undefined} onSelect={field.key === 'workoutPlanId' ? item => change('memberId', referenceId(item.memberId)) : undefined} />;
    if (field.options) return <View key={field.key} style={{ gap: 8 }}><Text style={ui.heading}>{field.label}</Text><View style={{ gap: 8 }}>{field.options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: values[field.key] === option.value, disabled: busy }} disabled={busy} onPress={() => change(field.key, option.value)} style={{ padding: 13, minHeight: 46, borderRadius: 10, backgroundColor: values[field.key] === option.value ? colors.pale : colors.background }}><Text style={ui.body}>{values[field.key] === option.value ? '●' : '○'} {option.label}</Text></Pressable>)}</View>{!!fieldError && <Text style={ui.error}>{fieldError}</Text>}</View>;
    return <Field key={field.key} label={field.label} value={values[field.key]} onChangeText={value => change(field.key, value)} editable={!busy} error={fieldError} multiline={field.type === 'multiline'} autoCapitalize={field.type === 'id' ? 'none' : 'sentences'} keyboardType={field.type === 'money' ? 'decimal-pad' : field.type === 'number' ? 'number-pad' : field.type === 'phone' ? 'phone-pad' : 'default'} />;
  })}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button disabled={busy} title={busy ? 'Đang lưu…' : 'Lưu thông tin'} onPress={save} /></View>;
}
