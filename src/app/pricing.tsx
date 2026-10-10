import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Brand, Button, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
import { colors, plans } from '@/data/sport';
export default function Pricing() {
  return <Screen><Brand /><Link href="/" style={ui.link}>← Trang chủ</Link><Text style={ui.eyebrow}>ĐẦU TƯ CHO SỨC KHỎE</Text><Text style={ui.title}>Gói tập dành cho bạn</Text><Text style={ui.body}>Giá và quyền lợi minh họa. Chọn gói để tiếp tục đăng ký, chưa thực hiện thanh toán.</Text>{plans.map(plan => <View key={plan.name} style={[ui.card, plan.name === 'Premium' && { borderColor: colors.primary, borderWidth: 2 }]}>{plan.name === 'Premium' && <Text style={ui.eyebrow}>ĐƯỢC YÊU THÍCH</Text>}<Text style={ui.heading}>{plan.name}</Text><Text style={ui.body}>{plan.description}</Text><Text style={ui.title}>{plan.price}đ<Text style={{ fontSize: 14, fontWeight: '400' }}> / tháng</Text></Text>{plan.features.map(feature => <Text key={feature} style={ui.body}>✓ {feature}</Text>)}<Button title={`Chọn ${plan.name} →`} secondary={plan.name !== 'Premium'} onPress={() => router.push({ pathname: '/register', params: { plan: plan.name } })} /></View>)}</Screen>;
}
