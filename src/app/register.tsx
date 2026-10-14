import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Brand, Button, Check, Field, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
import { useAuth } from '@/context/auth';
import { plans } from '@/data/sport';
import { validEmail, passwordStrength } from '@/utils/validation';
export default function Register() {
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  const selectedPlan = plans.some(p => p.name === plan) ? plan! : 'Basic';
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const errors = { email: !validEmail(form.email) ? 'Email chưa hợp lệ.' : '', password: form.password.length < 6 ? 'Mật khẩu cần ít nhất 6 ký tự.' : '', confirm: form.password !== form.confirm || !form.confirm ? 'Mật khẩu xác nhận không khớp.' : '' };
  async function submit() {
    if (busy) return;
    setSubmitted(true); setError('');
    if (Object.values(errors).some(Boolean) || !agreed) return;
    setBusy(true);
    try { await register({ email: form.email, password: form.password }); router.replace({ pathname: '/login', params: { email: form.email.trim(), registered: '1' } }); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <Screen><Brand /><View style={{ paddingTop: 20, gap: 8 }}><Text style={ui.eyebrow}>BẮT ĐẦU CÙNG ACTIVEHUB</Text><Text style={ui.title}>Tạo tài khoản hội viên</Text><Text style={ui.body}>Một bước nhỏ cho phiên bản khỏe hơn của bạn.</Text></View><View style={ui.card}><View style={ui.between}><Text style={ui.link}>Gói đã chọn: {selectedPlan}</Text><Link href="/pricing" style={ui.link}>Thay đổi</Link></View>{(['email', 'password', 'confirm'] as const).map(key => <Field key={key} label={{ email: 'Email', password: 'Mật khẩu', confirm: 'Xác nhận mật khẩu' }[key]} placeholder={{ email: 'ban@email.com', password: 'Tối thiểu 6 ký tự', confirm: 'Nhập lại mật khẩu' }[key]} value={form[key]} onChangeText={value => setForm(current => ({ ...current, [key]: value }))} password={key === 'password' || key === 'confirm'} autoCapitalize="none" keyboardType={key === 'email' ? 'email-address' : 'default'} error={submitted ? errors[key] : undefined} />)}{!!form.password && <Text style={ui.body}>Độ mạnh mật khẩu: {passwordStrength(form.password)}</Text>}<Check checked={agreed} onPress={() => setAgreed(!agreed)} label="Tôi đồng ý với điều khoản và chính sách quyền riêng tư." /><Link href="/terms" style={[ui.link, { paddingVertical: 10 }]}>Đọc điều khoản sử dụng →</Link>{submitted && !agreed && <Text style={ui.error}>Vui lòng đồng ý với điều khoản để tiếp tục.</Text>}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button disabled={busy} title={busy ? "Đang tạo tài khoản…" : "Tạo tài khoản →"} onPress={submit} /></View><Text style={[ui.body, { textAlign: 'center' }]}>Đã có tài khoản? <Link href="/login" style={ui.link}>Đăng nhập</Link></Text><Text style={[ui.body, { fontSize: 12 }]}>Tài khoản được đăng ký trên SportCenter. Gói đang chọn chỉ để tham khảo, chưa mua gói hoặc phát sinh thanh toán.</Text></Screen>;
}
