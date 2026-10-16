import type { PropsWithChildren } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from './ui';
import { colors } from '@/data/sport';
export const trainingPhoto = 'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?auto=format&fit=crop&w=1200&q=85';
export function AuthLayout({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.public }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: wide ? 32 : 24, maxWidth: 1320, width: '100%', alignSelf: 'center' }}><View style={{ marginBottom: 32 }}><Brand /></View><View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', gap: wide ? 80 : 0, alignItems: 'stretch' }}><View style={{ flex: 1, justifyContent: 'center', paddingVertical: 12 }}><View style={{ maxWidth: 440, width: '100%', alignSelf: 'center', gap: 22 }}>{children}</View></View>{wide && <ImageBackground source={{ uri: trainingPhoto }} imageStyle={{ borderRadius: 30 }} style={{ flex: 1, minHeight: 580, justifyContent: 'flex-end', borderRadius: 30, overflow: 'hidden', backgroundColor: colors.background }}><View style={{ position: 'absolute', inset: 0, backgroundColor: '#211b1855' }} /><View style={{ padding: 36, gap: 18 }}><Text style={{ color: '#fff', fontSize: 30, fontWeight: '700', lineHeight: 40 }}>“Kỷ luật trong tập luyện.{ '\n' }Rõ ràng trong vận hành.”</Text><Text style={{ color: '#fff9ef', fontSize: 15, lineHeight: 25 }}>ActiveHub giúp mọi người trong trung tâm cùng tiến về một hướng.</Text><Text style={{ color: '#eee0d4', fontSize: 11 }}>Ảnh: bruce mars · Unsplash</Text></View></ImageBackground>}</View><Text style={{ textAlign: 'center', color: colors.muted, fontSize: 11, paddingTop: 30, paddingBottom: 12 }}>ActiveHub · Cộng đồng yêu vận động</Text></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
