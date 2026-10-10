import { Text } from 'react-native';
import { router } from 'expo-router';
import { Brand, Button, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
export default function Terms() {
  return <Screen><Brand /><Text style={ui.title}>Điều khoản bản demo</Text><Text style={ui.body}>Ứng dụng này mô phỏng trải nghiệm ActiveHub để phát triển giao diện mobile. Các gói tập, giá và lịch lớp là dữ liệu minh họa.</Text><Text style={ui.heading}>Thông tin tài khoản</Text><Text style={ui.body}>Thông tin đăng ký chỉ nằm trong bộ nhớ của phiên chạy, không được gửi đến máy chủ hay lưu bền vững. Không nhập dữ liệu nhạy cảm hoặc mật khẩu đang dùng ở dịch vụ khác.</Text><Text style={ui.heading}>Đăng ký và đặt chỗ</Text><Text style={ui.body}>Chọn gói và đặt chỗ thử không tạo hợp đồng, không trừ tiền và không xác nhận lịch tập thật. Chức năng khôi phục chưa gửi email.</Text><Button title="Quay lại" secondary onPress={() => router.canGoBack() ? router.back() : router.replace('/register')} /></Screen>;
}
