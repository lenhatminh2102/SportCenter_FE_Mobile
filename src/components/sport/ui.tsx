import { useState, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/data/sport';
import { ui } from './styles';
export function Button({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ minHeight: 50, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: secondary ? colors.border : colors.primary, backgroundColor: secondary ? 'white' : colors.primary, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 })}><Text style={{ color: secondary ? colors.primary : 'white', fontSize: 15, fontWeight: '700' }}>{title}</Text></Pressable>;
}
export function Field({ label, error, password, ...props }: TextInputProps & { label: string; error?: string; password?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <View style={{ gap: 8 }}><Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }}>{label}</Text><View style={{ flexDirection: 'row', borderWidth: 1, borderColor: error ? '#dc2626' : colors.border, borderRadius: 12, backgroundColor: 'white', alignItems: 'center' }}><TextInput {...props} accessibilityLabel={label} placeholderTextColor="#94a3b8" secureTextEntry={password && !visible} style={{ flex: 1, minHeight: 50, padding: 14, color: colors.ink, fontSize: 15 }} />{password && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onPress={() => setVisible(!visible)} style={{ padding: 14 }}><Text style={ui.link}>{visible ? 'Ẩn' : 'Hiện'}</Text></Pressable>}</View>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}</View>;
}
export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={ui.page}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function Brand() {
  return <Pressable accessibilityRole="button" accessibilityLabel="ActiveHub, về trang chủ" onPress={() => router.navigate('/')} style={ui.row}><View style={{ backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontSize: 25 }}>⌁</Text></View><Text style={ui.heading}>ActiveHub<Text style={{ color: colors.primary }}>.</Text></Text></Pressable>;
}
export function Check({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={[ui.row, { minHeight: 44 }]}><View style={{ width: 23, height: 23, borderRadius: 6, backgroundColor: checked ? colors.primary : 'white', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white' }}>{checked ? '✓' : ''}</Text></View><Text style={[ui.body, { flex: 1 }]}>{label}</Text></Pressable>;
}
