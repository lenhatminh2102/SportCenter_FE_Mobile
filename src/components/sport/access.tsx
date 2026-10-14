import { ActivityIndicator, Text } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Brand, Button, Screen } from './ui';
import { ui } from './styles';
export function AccessScreen({ denied = false }: { denied?: boolean }) {
  const { sessionMessage } = useAuth();
  return <Screen><Brand /><Text style={ui.title}>{denied ? 'Bạn chưa có quyền truy cập' : 'Đăng nhập để tiếp tục'}</Text><Text style={ui.body}>{denied ? 'Tài khoản hiện tại không được phép thực hiện thao tác này.' : sessionMessage || 'Vui lòng đăng nhập bằng tài khoản SportCenter.'}</Text><Link href={denied ? '/account' : '/login'} style={ui.link}>{denied ? '← Tài khoản' : 'Đăng nhập →'}</Link></Screen>;
}
export function QueryStatus({ loading, error, retry }: { loading: boolean; error: Error | null; retry: () => void }) {
  if (loading) return <><ActivityIndicator accessibilityLabel="Đang tải dữ liệu" /><Text style={ui.body}>Đang tải…</Text></>;
  if (error) return <><Text accessibilityRole="alert" style={ui.error}>{error.message}</Text><Button secondary title="Thử lại" onPress={retry} /></>;
  return null;
}
