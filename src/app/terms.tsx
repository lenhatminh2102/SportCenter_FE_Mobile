import { Text } from 'react-native';
import { router } from 'expo-router';
import { Brand, Button, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
export default function Terms() {
  return <Screen><Brand /><Text style={ui.title}>Thông tin sử dụng</Text><Text style={ui.body}>Các lớp hiển thị cho khách chưa đăng nhập là minh họa theo thiết kế. Sau đăng nhập, lớp học và hồ sơ được tải từ trung tâm.</Text><Text style={ui.heading}>Thông tin tài khoản</Text><Text style={ui.body}>Email và mật khẩu được gửi tới backend SportCenter để tạo tài khoản và xác thực. Đăng nhập Google gửi ID token tới backend; tài khoản cần xác minh sẽ nhận OTP qua email. Phiên đăng nhập chỉ lưu trong bộ nhớ ứng dụng và kết thúc khi tải lại hoặc đăng xuất.</Text><Text style={ui.heading}>Đăng ký lớp học</Text><Text style={ui.body}>Gửi đăng ký lớp sẽ tạo bản ghi thật tại backend với trạng thái chờ thanh toán. Ứng dụng chưa thu tiền; việc gửi đăng ký không đồng nghĩa đã thanh toán hoặc được xác nhận tham gia. Chức năng đặt lại mật khẩu qua email chưa được cung cấp.</Text><Button title="Quay lại" secondary onPress={() => router.canGoBack() ? router.back() : router.replace('/register')} /></Screen>;
}
