import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { AuthLayout } from '@/components/sport/auth-layout';
import { Button, Field } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
import { colors } from '@/data/sport';
export default function VerifyOtp() {
  const { user, pendingOtp, verifyGoogleOtp, resendGoogleOtp, cancelGoogleOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  if (user) return <Redirect href="/dashboard" />;
  if (!pendingOtp) return <AuthLayout><Text style={ui.title}>Bắt đầu lại với Google</Text><Text style={ui.body}>Phiên xác minh chỉ được giữ trong lần chạy này. Vui lòng đăng nhập Google để nhận mã mới.</Text><Button title="Về đăng nhập" onPress={() => router.replace('/login')} /></AuthLayout>;
  const wait = Math.max(0, Math.ceil((pendingOtp.resendAt - now) / 1000));
  const expires = Math.max(0, Math.ceil((pendingOtp.expiresAt - now) / 1000));
  async function verify() {
    if (pending.current) return;
    setError(''); setMessage('');
    if (!/^\d{6}$/.test(otp)) { setError('Vui lòng nhập đủ 6 chữ số trong email.'); return; }
    pending.current = true; setBusy(true);
    try { await verifyGoogleOtp(otp); router.replace('/dashboard'); }
    catch (e) { setError((e as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  async function resend() {
    if (pending.current || wait > 0) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const next = await resendGoogleOtp();
      if (next === 'authenticated') router.replace('/dashboard');
      else { setOtp(''); setNow(Date.now()); setMessage('Đã gửi mã mới. Vui lòng kiểm tra hộp thư và thư rác.'); }
    } catch (e) { setError((e as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <AuthLayout><View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.primary, fontSize: 30 }}>✉</Text></View><View style={{ gap: 10 }}><Text style={ui.eyebrow}>XÁC MINH TÀI KHOẢN GOOGLE</Text><Text style={ui.title}>Kiểm tra hộp thư của bạn</Text><Text style={ui.body}>Nhập mã 6 số được gửi tới <Text style={{ fontWeight: '700', color: colors.ink }}>{pendingOtp.email}</Text> để hoàn tất đăng nhập.</Text></View><Field label="Mã xác minh" placeholder="000000" value={otp} onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" inputMode="numeric" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} editable={!busy} autoFocus onSubmitEditing={verify} /><Text style={{ color: expires ? colors.muted : '#b91c1c', fontSize: 13 }}>{expires ? `Mã còn hiệu lực ${Math.floor(expires / 60)}:${String(expires % 60).padStart(2, '0')}` : 'Mã đã hết hạn. Gửi lại để nhận mã mới.'}</Text>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}{!!message && <Text accessibilityRole="alert" style={{ color: colors.green, lineHeight: 23 }}>{message}</Text>}<Button title={busy ? 'Đang xử lý…' : 'Xác minh & tiếp tục →'} disabled={busy || !expires} onPress={verify} /><Button secondary title={wait ? `Gửi lại mã sau ${wait}s` : 'Gửi lại mã xác minh'} disabled={busy || wait > 0} onPress={resend} /><Button secondary title="Dùng tài khoản khác" disabled={busy} onPress={() => { cancelGoogleOtp(); router.replace('/login'); }} /><Text style={[ui.body, { fontSize: 12 }]}>OTP được gửi bởi SportCenter để xác minh tài khoản Google. Không chia sẻ mã này với người khác.</Text></AuthLayout>;
}
