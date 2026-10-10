import { Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
export default function NotFound() { return <Screen><Text style={ui.title}>Không tìm thấy trang</Text><Button title="Về trang chủ" onPress={() => router.replace('/')} /></Screen>; }
