import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Field } from './ui';
import { ui } from './styles';
import { colors } from '@/data/sport';
import { validPhone } from '@/utils/validation';
import type { MemberInput, MemberLevel } from '@/services/members';
export const levelLabels: Record<MemberLevel, string> = { BEGINNER: 'Mới bắt đầu', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' };
export function MemberForm({ initial, requireUserId = false, requireGoal = true, onSave, onSaved }: {
  initial?: Partial<MemberInput>; requireUserId?: boolean; requireGoal?: boolean;
  onSave: (input: MemberInput, userId: string) => Promise<unknown>; onSaved: () => void;
}) {
  const [form, setForm] = useState<MemberInput>({ fullName: initial?.fullName || '', phone: initial?.phone || '', goal: initial?.goal || '', level: initial?.level || 'BEGINNER' });
  const [userId, setUserId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const errors = {
    fullName: form.fullName.trim().length < 2 ? 'Nhập họ tên từ 2 ký tự.' : '',
    phone: !validPhone(form.phone) ? 'Nhập số điện thoại Việt Nam hợp lệ.' : '',
    goal: requireGoal && !form.goal.trim() ? 'Nhập mục tiêu tập luyện.' : '',
    userId: requireUserId && !/^[a-f\d]{24}$/i.test(userId.trim()) ? 'Nhập User ID gồm 24 ký tự của tài khoản MEMBER đã tồn tại.' : '',
  };
  async function submit() {
    if (saving.current) return;
    setSubmitted(true); setError('');
    if (Object.values(errors).some(Boolean)) return;
    saving.current = true; setBusy(true);
    try { await onSave(form, userId); onSaved(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được hồ sơ.'); }
    finally { saving.current = false; setBusy(false); }
  }
  return <View style={ui.card}>
    {requireUserId && <><Field label="User ID của tài khoản hội viên" placeholder="User ID từ /auth/me của hội viên" value={userId} onChangeText={setUserId} autoCapitalize="none" editable={!busy} error={submitted ? errors.userId : undefined} /><Text style={[ui.body, { fontSize: 12 }]}>Hồ sơ gắn với tài khoản MEMBER đã đăng ký; không phải mã hồ sơ hội viên.</Text></>}
    {(['fullName', 'phone', 'goal'] as const).map(key => <Field key={key} label={{ fullName: 'Họ và tên', phone: 'Số điện thoại', goal: requireGoal ? 'Mục tiêu tập luyện' : 'Mục tiêu tập luyện (tùy chọn)' }[key]} value={form[key]} onChangeText={value => setForm(current => ({ ...current, [key]: value }))} editable={!busy} keyboardType={key === 'phone' ? 'phone-pad' : 'default'} multiline={key === 'goal'} error={submitted ? errors[key] : undefined} />)}
    <Text style={ui.heading}>Trình độ</Text><View style={{ gap: 8 }}>{(Object.keys(levelLabels) as MemberLevel[]).map(level => <Pressable key={level} accessibilityRole="radio" accessibilityState={{ checked: form.level === level, disabled: busy }} disabled={busy} onPress={() => setForm(current => ({ ...current, level }))} style={{ minHeight: 46, padding: 12, borderRadius: 10, backgroundColor: form.level === level ? colors.pale : colors.background }}><Text style={{ color: form.level === level ? colors.primary : colors.muted }}>{form.level === level ? '●' : '○'} {levelLabels[level]}</Text></Pressable>)}</View>
    {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button disabled={busy} title={busy ? 'Đang lưu…' : 'Lưu hồ sơ'} onPress={submit} />
  </View>;
}
