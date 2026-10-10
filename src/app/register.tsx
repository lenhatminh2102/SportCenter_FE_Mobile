import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Brand, Button, Check, Field, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
import { useAuth } from '@/context/auth';
import { plans } from '@/data/sport';
import { validEmail, validPhone, passwordStrength } from '@/utils/validation';
export default function Register() {
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  const selectedPlan = plans.some(p => p.name === plan) ? plan! : 'Basic';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const errors = { name: form.name.trim().length < 2 ? 'Nhập họ tên từ 2 ký tự.' : '', email: !validEmail(form.email) ? 'Email chưa hợp lệ.' : '', phone: !validPhone(form.phone) ? 'Nhập số điện thoại Việt Nam hợp lệ (10 số).' : '', password: form.password.length < 6 ? 'Mật khẩu cần ít nhất 6 ký tự.' : '', confirm: form.password !== form.confirm || !form.confirm ? 'Mật khẩu xác nhận không khớp.' : '' };
  function submit() {
    setSubmitted(true); setError('');
    if (Object.values(errors).some(Boolean) || !agreed) return;
    try { register({ ...form, plan: selectedPlan }); router.replace({ pathname: '/login', params: { email: form.email.trim(), registered: '1' } }); } catch (e) { setError((e as Error).message); }
  }
  return <Screen><Brand /><View style={{ paddingTop: 20, gap: 8 }}><Text style={ui.eyebrow}>BẮT ĐẦU CÙNG ACTIVEHUB</Text><Text style={ui.title}>Tạo tài khoản hội viên</Text><Text style={ui.body}>Một bước nhỏ cho phiên bản khỏe hơn của bạn.</Text></View><View style={ui.card}><View style={ui.between}><Text style={ui.link}>Gói đã chọn: {selectedPlan}</Text><Link href="/pricing" style={ui.link}>Thay đổi</Link></View>{(['name', 'email', 'phone', 'password', 'confirm'] as const).map(key => <Field key={key} label={{ name: 'Họ và tên', email: 'Email', phone: 'Số điện thoại', password: 'Mật khẩu', confirm: 'Xác nhận mật khẩu' }[key]} placeholder={{ name: 'Nguyễn Văn A', email: 'ban@email.com', phone: '0901234567', password: 'Tối thiểu 6 ký tự', confirm: 'Nhập lại mật khẩu' }[key]} value={form[key]} onChangeText={value => setForm(current => ({ ...current, [key]: value }))} password={key === 'password' || key === 'confirm'} autoCapitalize={key === 'name' ? 'words' : 'none'} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'} error={submitted ? errors[key] : undefined} />)}{!!form.password && <Text style={ui.body}>Độ mạnh mật khẩu: {passwordStrength(form.password)}</Text>}<Check checked={agreed} onPress={() => setAgreed(!agreed)} label="Tôi đồng ý với điều khoản và chính sách quyền riêng tư." /><Link href="/terms" style={[ui.link, { paddingVertical: 10 }]}>Đọc điều khoản sử dụng →</Link>{submitted && !agreed && <Text style={ui.error}>Vui lòng đồng ý với điều khoản để tiếp tục.</Text>}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button title="Tạo tài khoản →" onPress={submit} /></View><Text style={[ui.body, { textAlign: 'center' }]}>Đã có tài khoản? <Link href="/login" style={ui.link}>Đăng nhập</Link></Text><Text style={[ui.body, { fontSize: 12 }]}>Demo trong phiên chạy, chưa kết nối máy chủ. Không nhập mật khẩu thật; đăng ký chưa phát sinh thanh toán.</Text></Screen>;
}
