import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Button, Screen } from '@/components/sport/ui';
import { AccessScreen } from '@/components/sport/access';
import { ui } from '@/components/sport/styles';
import { resources } from '@/utils/resources';
import type { ResourceKey } from '@/services/operations';
import { canManagePayments } from '@/services/payments';
import { canResolveSupport } from '@/services/support';
const groups: { title: string; subtitle: string; symbol: string; keys: ResourceKey[] }[] = [
  { title: 'Lịch & lớp học', subtitle: 'Sắp xếp thời gian và tham gia lớp phù hợp.', symbol: '◷', keys: ['schedules', 'classes', 'class-registrations', 'attendances'] },
  { title: 'Hành trình tập luyện', subtitle: 'Theo dõi kế hoạch và từng bước tiến bộ.', symbol: '↗', keys: ['workout-plans', 'workout-results', 'lesson-progress'] },
  { title: 'Khám phá trung tâm', subtitle: 'Huấn luyện viên, bộ môn và nội dung khóa học.', symbol: '⌁', keys: ['coaches', 'subjects', 'courses', 'learning-paths', 'lessons', 'rooms'] },
];
export default function Operations() {
  const { user } = useAuth();
  if (!user) return <AccessScreen />;
  return <Screen>{user.role === 'MEMBER' && <Link href="/member" style={ui.link}>← Trang chủ của tôi</Link>}<Text style={ui.eyebrow}>ACTIVEHUB · KHÔNG GIAN CỦA BẠN</Text><Text style={ui.title}>{user.role === 'MEMBER' ? 'Hôm nay bạn muốn làm gì?' : 'Điều hành trung tâm'}</Text><Text style={ui.body}>Lịch học, kết quả và dịch vụ được kết nối trong cùng một nơi.</Text>{groups.map(group => <View key={group.title} style={ui.card}><Text style={ui.eyebrow}>{group.symbol} ACTIVEHUB</Text><Text style={ui.heading}>{group.title}</Text><Text style={ui.body}>{group.subtitle}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{group.keys.map(resource => <View key={resource} style={{ flexGrow: 1, flexBasis: 180 }}><Button secondary title={resource === 'schedules' && user.role === 'MEMBER' ? 'Lịch tập của tôi' : resources[resource].title} onPress={() => router.push({ pathname: '/workspace/[resource]', params: { resource } })} /></View>)}</View></View>)}<View style={ui.card}><Text style={ui.heading}>Dịch vụ & kết nối</Text><Text style={ui.body}>Cập nhật thông báo, học phí và liên hệ trung tâm.</Text><Button secondary title="Khóa học & học phí →" onPress={() => router.push('/pricing')} /><Button secondary title="Thông báo của tôi →" onPress={() => router.push('/notifications')} />{canManagePayments(user.role) && <Button secondary title="Thanh toán học phí →" onPress={() => router.push('/payments')} />}{(user.role === 'MEMBER' || canResolveSupport(user.role)) && <Button secondary title="Trung tâm hỗ trợ →" onPress={() => router.push('/support')} />}</View>{user.role === 'CENTER_MANAGER' && <Button secondary title="Lịch sử thao tác →" onPress={() => router.push({ pathname: '/workspace/[resource]', params: { resource: 'activity-logs' } })} />}<Button secondary title="Tài khoản của tôi" onPress={() => router.push('/account')} /></Screen>;
}
