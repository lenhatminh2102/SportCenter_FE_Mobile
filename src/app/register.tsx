import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Button, Check, Field } from '@/components/sport/ui';
import { AuthLayout } from '@/components/sport/auth-layout';
import { GoogleLogin } from '@/components/sport/google-login';
import { ui } from '@/components/sport/styles';
import { useAuth } from '@/context/auth';
import { validEmail, passwordStrength } from '@/utils/validation';
import { colors } from '@/data/sport';
export default function Register() {
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const pending = useRef(false);
  const { register, login } = useAuth();
  const [created, setCreated] = useState(false);
  const errors = { email: !validEmail(form.email) ? 'Email chưa hợp lệ.' : '', password: form.password.length < 6 ? 'Mật khẩu cần ít nhất 6 ký tự.' : '', confirm: form.password !== form.confirm || !form.confirm ? 'Mật khẩu xác nhận không khớp.' : '' };
  const strength = passwordStrength(form.password);
  const score = strength === 'Mạnh' ? 3 : strength === 'Trung bình' ? 2 : 1;
  async function submit() {
    if (pending.current || googleBusy) return;
    if (created) { router.replace({ pathname: '/login', params: { email: form.email.trim(), registered: '1' } }); return; }
    setSubmitted(true); setError('');
    if (Object.values(errors).some(Boolean) || !agreed) return;
    pending.current = true; setBusy(true);
    try {
      await register({ email: form.email, password: form.password }); setCreated(true);
      try { await login(form.email, form.password); router.replace('/dashboard'); }
      catch { setError('Tài khoản đã tạo thành công, nhưng chưa đăng nhập được. Bấm bên dưới để đăng nhập, không cần đăng ký lại.'); }
    }
    catch (e) { setError((e as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <AuthLayout><View style={{ gap: 10 }}><Text style={ui.eyebrow}>HÀNH TRÌNH CỦA BẠN BẮT ĐẦU TỪ ĐÂY</Text><Text style={[ui.title, { fontSize: 32, lineHeight: 41 }]}>Tạo tài khoản hội viên</Text><Text style={ui.body}>Bắt đầu hành trình cùng ActiveHub.</Text></View>{!!plan && <Text style={{ color: colors.primary, padding: 14, backgroundColor: colors.pale, borderRadius: 12 }}>Lựa chọn quan tâm: {plan}</Text>}{(['email', 'password', 'confirm'] as const).map(key => <Field key={key} label={{ email: 'Email', password: 'Mật khẩu', confirm: 'Xác nhận mật khẩu' }[key]} placeholder={{ email: 'name@email.com', password: 'Tối thiểu 6 ký tự', confirm: 'Nhập lại mật khẩu' }[key]} value={form[key]} onChangeText={value => setForm(current => ({ ...current, [key]: value }))} password={key !== 'email'} autoCapitalize="none" keyboardType={key === 'email' ? 'email-address' : 'default'} autoComplete={key === 'email' ? 'email' : 'new-password'} editable={!busy && !googleBusy && !created} error={submitted ? errors[key] : undefined} />)}{!!form.password && <View style={{ gap: 7 }}><View style={{ flexDirection: 'row', gap: 5 }}>{[1, 2, 3].map(index => <View key={index} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: index <= score ? score === 3 ? colors.green : colors.primary : colors.border }} />)}</View><Text style={[ui.body, { fontSize: 12 }]}>Độ mạnh: {strength}</Text></View>}<Check checked={agreed} onPress={() => { if (!busy && !googleBusy) setAgreed(!agreed); }} label="Tôi đồng ý với điều khoản và chính sách quyền riêng tư." /><Link href="/terms" style={ui.link}>Đọc điều khoản sử dụng →</Link>{submitted && !agreed && <Text style={ui.error}>Vui lòng đồng ý với điều khoản để tiếp tục.</Text>}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button disabled={busy || googleBusy} title={busy ? 'Đang tạo và đăng nhập…' : created ? 'Đăng nhập tài khoản đã tạo →' : 'Tạo tài khoản →'} onPress={submit} /><GoogleLogin disabled={busy || created || !agreed} onBusyChange={setGoogleBusy} /><Text style={[ui.body, { textAlign: 'center' }]}>Đã có tài khoản? <Link href="/login" style={ui.link}>Đăng nhập</Link></Text><Text style={[ui.body, { fontSize: 12 }]}>Bạn có thể bổ sung hồ sơ tập luyện sau khi đăng nhập. Google sẽ yêu cầu OTP email khi tài khoản chưa xác minh.</Text></AuthLayout>;
}
