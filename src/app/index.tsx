import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Brand, Button, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
import { classes, colors } from '@/data/sport';
import { useAuth } from '@/context/auth';
export default function Home() {
  const { user, logout } = useAuth();
  const [category, setCategory] = useState('Tất cả');
  return <Screen><View style={ui.between}><Brand /><Pressable accessibilityRole="button" onPress={() => user ? (logout(), router.replace('/')) : router.push('/login')} style={{ paddingVertical: 12 }}><Text style={ui.link}>{user ? 'Đăng xuất' : 'Đăng nhập →'}</Text></Pressable></View>
    <View style={{ backgroundColor: colors.pale, borderRadius: 24, padding: 24, gap: 18 }}><Text style={ui.eyebrow}>MOVE BETTER. LIVE BETTER.</Text><Text style={[ui.title, { fontSize: 36, lineHeight: 44 }]}>{user ? `Chào ${user.name}!` : 'Khỏe hơn mỗi ngày.\nCùng ActiveHub.'}</Text><Text style={ui.body}>{user ? `Gói tập đã chọn: ${user.plan}. Sẵn sàng cho buổi tập tiếp theo?` : 'Một nơi cho mọi mục tiêu tập luyện. Khám phá lớp học, chọn gói phù hợp và bắt đầu hành trình của bạn.'}</Text><Button title={user ? 'Khám phá gói tập' : 'Bắt đầu ngay →'} onPress={() => router.push(user ? '/pricing' : '/register')} /><Button secondary title="Xem các gói tập" onPress={() => router.push('/pricing')} /><Image accessibilityLabel="Không gian tập luyện thể thao" source={{ uri: 'https://images.unsplash.com/photo-1606335544665-96055053b5c0?auto=format&fit=crop&w=900&q=80' }} style={{ width: '100%', height: 200, borderRadius: 16, backgroundColor: '#dbe3ef' }} /></View>
    <View style={[ui.card, ui.between]}>{[['1.200+', 'Hội viên'], ['32+', 'Lớp học'], ['20+', 'Huấn luyện viên']].map(([number, label]) => <View key={label} style={{ flex: 1, gap: 5 }}><Text style={[ui.heading, { color: colors.primary }]}>{number}</Text><Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text></View>)}</View>
    <View style={{ gap: 8 }}><Text style={ui.eyebrow}>TÌM NHỊP TẬP CỦA BẠN</Text><Text style={ui.heading}>Lớp học nổi bật</Text><Text style={ui.body}>Dữ liệu minh họa từ bản thiết kế web.</Text></View>
    <View style={[ui.row, { flexWrap: 'wrap' }]}>{['Tất cả', 'Yoga', 'Gym', 'Boxing'].map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === category }} onPress={() => setCategory(item)} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, backgroundColor: item === category ? colors.primary : 'white', borderWidth: 1, borderColor: colors.border }}><Text style={{ color: item === category ? 'white' : colors.muted }}>{item}</Text></Pressable>)}</View>
    {classes.filter(item => category === 'Tất cả' || item.category === category).map(item => <Pressable key={item.name} accessibilityRole="button" onPress={() => router.push({ pathname: '/class-detail', params: { name: item.name } })} style={ui.card}><View style={ui.between}><Text style={{ fontSize: 30, color: colors.primary }}>{item.symbol}</Text><Text style={ui.link}>{item.category} ↗</Text></View><Text style={ui.heading}>{item.name}</Text><Text style={ui.body}>{item.time} · HLV {item.coach}</Text><Text style={ui.link}>Xem chi tiết →</Text></Pressable>)}
    <View style={[ui.card, { backgroundColor: '#172e60' }]}><Text style={[ui.heading, { color: 'white' }]}>Hành trình mới bắt đầu từ hôm nay</Text><Text style={[ui.body, { color: '#cbd5e1' }]}>Linh hoạt lựa chọn. Tập theo cách của bạn.</Text><Button title="Chọn gói tập phù hợp" onPress={() => router.push('/pricing')} /></View><Text style={[ui.body, { textAlign: 'center', fontSize: 12 }]}>ActiveHub · Cộng đồng thể thao Việt Nam</Text>
  </Screen>;
}
