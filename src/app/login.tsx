import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Brand, Button, Field, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
import { useAuth } from '@/context/auth';
import { validEmail } from '@/utils/validation';
export default function Login() {
  const params = useLocalSearchParams<{ email?: string; registered?: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  function submit() {
    setSubmitted(true); setError('');
    if (!validEmail(email) || password.length < 6) return;
    try { login(email, password); router.replace('/'); } catch (e) { setError((e as Error).message); }
  }
  return <Screen><Brand /><View style={{ paddingTop: 32, gap: 10 }}><Text style={ui.eyebrow}>CHÀO MỪNG TRỞ LẠI</Text><Text style={ui.title}>Tiếp tục hành trình{ '\n' }của bạn.</Text><Text style={ui.body}>Đăng nhập để kết nối cùng ActiveHub.</Text></View>{params.registered === '1' && <Text style={{ color: '#15803d', lineHeight: 24 }}>Đăng ký thành công! Hãy đăng nhập bằng tài khoản vừa tạo.</Text>}<View style={ui.card}><Field label="Email" placeholder="ban@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" error={submitted && !validEmail(email) ? 'Vui lòng nhập email hợp lệ.' : undefined} /><Field label="Mật khẩu" placeholder="Nhập mật khẩu" password value={password} onChangeText={setPassword} autoComplete="current-password" onSubmitEditing={submit} error={submitted && password.length < 6 ? 'Mật khẩu cần ít nhất 6 ký tự.' : undefined} /><Link href="/forgot-password" style={[ui.link, { paddingVertical: 12, textAlign: 'right' }]}>Quên mật khẩu?</Link>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button title="Đăng nhập →" onPress={submit} /></View><Text style={[ui.body, { textAlign: 'center' }]}>Chưa có tài khoản? <Link href="/register" style={ui.link}>Đăng ký ngay</Link></Text><Text style={[ui.body, { fontSize: 12 }]}>Bản demo giao diện: đăng ký trước khi đăng nhập. Tài khoản được giữ trong bộ nhớ và mất khi tải lại ứng dụng. Không sử dụng mật khẩu thật.</Text></Screen>;
}
