import { Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { roleHome } from '@/utils/staff-navigation';
import { workflowDescriptions } from '@/utils/role-workflows';
import { Screen, Button } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
export default function Reception() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'RECEPTIONIST') return <Redirect href={roleHome(user.role)} />;
  return <Screen><Text style={ui.eyebrow}>ACTIVEHUB · TIẾP ĐÓN</Text><Text style={ui.title}>Chào {user.name}</Text><Text style={ui.body}>Hỗ trợ hội viên từ hồ sơ, tư vấn lịch đến đăng ký và theo dõi học phí.</Text><View style={ui.card}><Text style={ui.heading}>{workflowDescriptions.RECEPTIONIST.title}</Text>{workflowDescriptions.RECEPTIONIST.steps.map((step, index) => <Text key={step} style={ui.body}>{index + 1}. {step}</Text>)}<Button title="Đăng ký lớp cho hội viên →" onPress={() => router.push('/enroll')} /><Button secondary title="Tra cứu hoặc tạo hồ sơ hội viên" onPress={() => router.push('/members')} /></View><View style={ui.card}><Text style={ui.heading}>Theo dõi sau đăng ký</Text><Button secondary title="Đăng ký đang chờ xử lý" onPress={() => router.push({ pathname: '/workspace/[resource]', params: { resource: 'class-registrations' } })} /><Button secondary title="Theo dõi thanh toán" onPress={() => router.push('/payments')} /><Button secondary title="Xử lý yêu cầu hỗ trợ" onPress={() => router.push('/support')} /></View><View style={ui.card}><Text style={ui.heading}>Tiếp đón buổi học</Text><Button secondary title="Lịch lớp hôm nay" onPress={() => router.push({ pathname: '/workspace/[resource]', params: { resource: 'schedules' } })} /><Button secondary title="Điểm danh hội viên" onPress={() => router.push({ pathname: '/workspace/[resource]', params: { resource: 'attendances' } })} /></View></Screen>;
}
