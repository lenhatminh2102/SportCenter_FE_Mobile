import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Brand, Button, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
import { classes } from '@/data/sport';
import { useAuth } from '@/context/auth';
export default function ClassDetail() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const item = classes.find(c => c.name === name);
  const { user } = useAuth();
  const [booked, setBooked] = useState(false);
  return <Screen><Brand /><Link href="/" style={ui.link}>← Trang chủ</Link>{item ? <View style={ui.card}><Text style={ui.eyebrow}>{item.category.toUpperCase()}</Text><Text style={ui.title}>{item.name}</Text><Text style={ui.body}>{item.detail}</Text><Text style={ui.body}>Khung giờ mẫu: {item.time}{'\n'}Huấn luyện viên: {item.coach}</Text><Text style={ui.body}>Đặt chỗ thử để trải nghiệm giao diện; chưa tạo lịch tại trung tâm.</Text>{booked && <Text accessibilityRole="alert" style={{ color: '#15803d', lineHeight: 24 }}>Đã ghi nhận đặt chỗ demo cho {user?.name} trong màn hình này.</Text>}<Button disabled={booked} title={booked ? 'Đã đặt chỗ demo ✓' : user ? 'Đặt chỗ thử' : 'Đăng nhập để đặt chỗ'} onPress={() => user ? setBooked(true) : router.push('/login')} /></View> : <><Text style={ui.title}>Không tìm thấy lớp học</Text><Button title="Về trang chủ" onPress={() => router.replace('/')} /></>}</Screen>;
}
