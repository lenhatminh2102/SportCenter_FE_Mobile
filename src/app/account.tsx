import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Brand, Button, Screen } from '@/components/sport/ui';
import { AccessScreen } from '@/components/sport/access';
import { ui } from '@/components/sport/styles';
import { useAuth } from '@/context/auth';
import { isWorkspaceRole, roleHome } from '@/utils/staff-navigation';
import { canManagePayments } from '@/services/payments';
import { canResolveSupport } from '@/services/support';
import { canManageMembers } from '@/utils/permissions';
const roles: Record<string, string> = { MEMBER: 'Hội viên', CENTER_MANAGER: 'Quản lý trung tâm', COACH: 'Huấn luyện viên', RECEPTIONIST: 'Lễ tân' };
export default function Account() {
  const { user, refreshUser, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!user) return <AccessScreen />;
  async function refresh() {
    setBusy(true); setMessage('');
    try { await refreshUser(); setMessage('Đã cập nhật thông tin tài khoản.'); }
    catch (e) { setMessage((e as Error).message); }
    finally { setBusy(false); }
  }
  return <Screen><Brand /><Link href={roleHome(user.role)} style={ui.link}>← Trang chủ của tôi</Link><Text style={ui.eyebrow}>ACTIVEHUB · GÓC CÁ NHÂN</Text><Text style={ui.title}>Xin chào, {user.name}</Text><View style={ui.card}><Text selectable style={ui.heading}>{user.email}</Text><Text style={ui.body}>Vai trò: {roles[user.role] || user.role}</Text><Text style={ui.body}>● {user.status === 'ACTIVE' ? 'Tài khoản đang hoạt động' : user.status}</Text><Button secondary title={busy ? 'Đang cập nhật…' : 'Làm mới tài khoản'} disabled={busy} onPress={refresh} />{!!message && <Text accessibilityRole="alert" style={ui.body}>{message}</Text>}</View>
    {isWorkspaceRole(user.role) && <Button title="Mở dashboard →" onPress={() => router.push(roleHome(user.role))} />}
    {user.role === 'MEMBER' && <Button title="Hồ sơ tập luyện của tôi →" onPress={() => router.push('/profile')} />}
    <View style={ui.card}><Text style={ui.heading}>Dịch vụ của bạn</Text><Button secondary title="Thông báo của tôi →" onPress={() => router.push('/notifications')} />{canManagePayments(user.role) && <Button secondary title="Thanh toán học phí →" onPress={() => router.push('/payments')} />}{(user.role === 'MEMBER' || canResolveSupport(user.role)) && <Button secondary title="Trung tâm hỗ trợ →" onPress={() => router.push('/support')} />}</View>
    {user.role !== 'MEMBER' && <Button secondary title={canManageMembers(user.role) ? 'Quản lý hội viên →' : 'Danh sách hội viên →'} onPress={() => router.push('/members')} />}
    <Button title="Tất cả tiện ích →" onPress={() => router.push('/operations')} />
    <Button secondary title="Đăng xuất" onPress={() => { logout(); router.replace('/login'); }} /><Text style={[ui.body, { fontSize: 12 }]}>Phiên đăng nhập chỉ được giữ trong lần chạy này. Tải lại ứng dụng sẽ cần đăng nhập lại.</Text></Screen>;
}
