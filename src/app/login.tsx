import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Button, Field } from '@/components/sport/ui';
import { AuthLayout } from '@/components/sport/auth-layout';
import { ui } from '@/components/sport/styles';
import { useAuth } from '@/context/auth';
import { GoogleLogin } from '@/components/sport/google-login';
import { validEmail } from '@/utils/validation';
export default function Login() {
  const params = useLocalSearchParams<{ email?: string; registered?: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const pending = useRef(false);
  const { login, sessionMessage } = useAuth();
  async function submit() {
    if (pending.current || googleBusy) return;
    setSubmitted(true); setError('');
    if (!validEmail(email) || password.length < 6) return;
    pending.current = true; setBusy(true);
    try { await login(email, password); router.replace('/dashboard'); }
    catch (e) { setError((e as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <AuthLayout><View style={{ gap: 10 }}><Text style={ui.eyebrow}>VUI VÌ BẠN ĐÃ QUAY LẠI</Text><Text style={[ui.title, { fontSize: 32, lineHeight: 41 }]}>Chào mừng trở lại</Text><Text style={ui.body}>Đăng nhập để tiếp tục với ActiveHub.</Text></View>{params.registered === '1' && <Text style={{ color: '#15803d', lineHeight: 24 }}>Tạo tài khoản thành công! Đăng nhập để bắt đầu tập luyện.</Text>}{!!sessionMessage && <Text style={ui.error}>{sessionMessage}</Text>}<Field label="Email" placeholder="name@center.vn" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" editable={!busy && !googleBusy} error={submitted && !validEmail(email) ? 'Vui lòng nhập email hợp lệ.' : undefined} /><Field label="Mật khẩu" placeholder="Nhập mật khẩu" password value={password} onChangeText={setPassword} autoComplete="current-password" editable={!busy && !googleBusy} onSubmitEditing={submit} error={submitted && password.length < 6 ? 'Mật khẩu cần ít nhất 6 ký tự.' : undefined} /><Link href="/forgot-password" style={[ui.link, { paddingVertical: 4, textAlign: 'right' }]}>Quên mật khẩu?</Link>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button disabled={busy || googleBusy} title={busy ? 'Đang đăng nhập…' : 'Đăng nhập →'} onPress={submit} /><View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}><View style={{ height: 1, flex: 1, backgroundColor: '#dfcfc4' }} /><Text style={[ui.body, { fontSize: 12 }]}>hoặc tiếp tục với</Text><View style={{ height: 1, flex: 1, backgroundColor: '#dfcfc4' }} /></View><GoogleLogin disabled={busy} onBusyChange={setGoogleBusy} /><Text style={[ui.body, { textAlign: 'center' }]}>Chưa có tài khoản? <Link href="/register" style={ui.link}>Đăng ký ngay</Link></Text></AuthLayout>;
}
