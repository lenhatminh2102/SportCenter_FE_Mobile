import { Text } from 'react-native';
import { Link } from 'expo-router';
import { AuthLayout } from '@/components/sport/auth-layout';
import { ui } from '@/components/sport/styles';
export default function ForgotPassword() {
  return <AuthLayout><Text style={ui.eyebrow}>HỖ TRỢ TÀI KHOẢN</Text><Text style={ui.title}>Quên mật khẩu?</Text><Text style={ui.body}>Trung tâm chưa cung cấp chức năng đặt lại mật khẩu qua email. Vui lòng liên hệ nhân viên để được hỗ trợ tài khoản của bạn.</Text><Text style={ui.body}>Mã OTP email hiện dùng để xác minh khi đăng nhập bằng Google; mã này không đặt lại mật khẩu.</Text><Link href="/login" style={[ui.link, { paddingVertical: 14 }]}>← Quay lại đăng nhập</Link></AuthLayout>;
}
