import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Brand, Button, Screen } from '@/components/sport/ui';
import { AccessScreen } from '@/components/sport/access';
import { ui } from '@/components/sport/styles';
import { resources } from '@/utils/resources';
import type { ResourceKey } from '@/services/operations';
const descriptions: Record<ResourceKey, string> = {
  rooms: 'Phòng tập, sức chứa và trạng thái sử dụng.',
  coaches: 'Danh sách và thông tin huấn luyện viên.', schedules: 'Lịch lớp học, bài học và lịch tập của bạn.',
  'activity-logs': 'Các thao tác đã được ghi nhận trên hệ thống.', subjects: 'Các môn thể thao tại trung tâm.',
  classes: 'Lớp học thực tế và đăng ký tham gia.', 'class-registrations': 'Theo dõi và hủy đăng ký lớp.', attendances: 'Ghi nhận có mặt, vắng mặt theo buổi học.',
  'learning-paths': 'Lộ trình học theo từng khóa.', 'lesson-progress': 'Cập nhật tiến độ hoàn thành bài học.', 'workout-plans': 'Kế hoạch tập luyện do coach phụ trách.', 'workout-results': 'Ghi nhận kết quả và nhận xét buổi tập.',
  courses: 'Nội dung và trạng thái các khóa học.', lessons: 'Bài học và thứ tự trong lộ trình tập luyện.',
};
export default function Operations() {
  const { user } = useAuth();
  if (!user) return <AccessScreen />;
  return <Screen><Brand /><Link href="/account" style={ui.link}>← Tài khoản</Link><Text style={ui.eyebrow}>KHÁM PHÁ & QUẢN LÝ</Text><Text style={ui.title}>Chức năng trung tâm</Text><Text style={ui.body}>Các chức năng và thao tác được hiển thị theo vai trò tài khoản.</Text>{(Object.keys(resources) as ResourceKey[]).map(resource => <View key={resource} style={ui.card}><Text style={ui.heading}>{resources[resource].title}</Text><Text style={ui.body}>{descriptions[resource]}</Text><Button secondary title={resource === 'schedules' && user.role === 'MEMBER' ? 'Xem lịch của tôi →' : 'Xem danh sách →'} onPress={() => router.push({ pathname: '/workspace/[resource]', params: { resource } })} /></View>)}</Screen>;
}
