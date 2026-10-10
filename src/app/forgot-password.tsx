import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Brand, Button, Field, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
import { validEmail } from '@/utils/validation';
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);
  return <Screen><Brand /><Text style={ui.title}>Quên mật khẩu?</Text><Text style={ui.body}>Nhập email để xem luồng yêu cầu khôi phục.</Text><View style={ui.card}>{sent ? <><Text style={ui.heading}>Đã ghi nhận yêu cầu demo</Text><Text accessibilityRole="alert" style={ui.body}>Email: {email.trim()}. Bản này chưa kết nối dịch vụ email nên không gửi liên kết và không đổi mật khẩu. Bạn có thể đăng ký tài khoản demo với email khác.</Text><Button secondary title="Nhập email khác" onPress={() => { setSent(false); setSubmitted(false); }} /></> : <><Field label="Email đã đăng ký" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="ban@email.com" error={submitted && !validEmail(email) ? 'Vui lòng nhập email hợp lệ.' : undefined} /><Button title="Yêu cầu khôi phục (demo)" onPress={() => { setSubmitted(true); if (validEmail(email)) setSent(true); }} /></>}</View><Link href="/login" style={[ui.link, { paddingVertical: 14 }]}>← Quay lại đăng nhập</Link></Screen>;
}
