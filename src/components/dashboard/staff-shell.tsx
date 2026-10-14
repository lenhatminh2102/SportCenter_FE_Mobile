import { useState, type PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/context/auth';
import { StaffShellContext } from '@/context/staff-shell';
import { activeMenuItem, isStaffPage, isStaffRole, staffMenu, type StaffRole } from '@/utils/staff-navigation';
import { colors } from '@/data/sport';
function Sidebar({ role, close }: { role: StaffRole; close: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const menu = staffMenu(role);
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#102345' }}><View style={{ padding: 22, gap: 6 }}><Text style={{ color: 'white', fontWeight: '800', fontSize: 25 }}>⌁ ActiveHub.</Text><Text style={{ color: '#9fb3d4', fontSize: 12 }}>{role === 'COACH' ? 'COACH WORKSPACE' : 'MANAGER WORKSPACE'}</Text></View><ScrollView contentContainerStyle={{ padding: 12, gap: 5 }}>
    {menu.map((item, index) => { const active = activeMenuItem(pathname, item); return <View key={item.path}>{index === 0 || menu[index - 1].group !== item.group ? <Text style={{ color: '#8da3c4', fontSize: 10, letterSpacing: 1.5, marginTop: 18, marginBottom: 10, paddingHorizontal: 12 }}>{item.group}</Text> : null}<Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => { close(); router.navigate(item.href); }} style={({ pressed }) => ({ minHeight: 46, padding: 12, borderRadius: 10, flexDirection: 'row', gap: 12, backgroundColor: active ? '#2b4c85' : pressed ? '#203957' : 'transparent' })}><Text style={{ width: 20, color: active ? '#a8caff' : '#8da3c4', fontSize: 18 }}>{item.symbol}</Text><Text style={{ color: active ? 'white' : '#d6e1f2', fontWeight: active ? '700' : '400', fontSize: 14, flex: 1 }}>{item.label}</Text></Pressable></View>; })}
  </ScrollView><View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#284163', gap: 10 }}><Text numberOfLines={1} style={{ color: '#d6e1f2', fontSize: 12 }}>{user?.email}</Text><Pressable accessibilityRole="button" onPress={() => { close(); logout(); router.replace('/login'); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: '#b7c8e2', fontWeight: '600' }}>↪ Đăng xuất</Text></Pressable></View></SafeAreaView>;
}
export function StaffShell({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const active = isStaffRole(user?.role) && isStaffPage(pathname);
  const role = isStaffRole(user?.role) ? user.role : null;
  const wide = width >= 1000;
  const current = role ? staffMenu(role).find(item => activeMenuItem(pathname, item)) : null;
  return <StaffShellContext.Provider value={active}><View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
    {active && wide && role ? <View style={{ width: 258 }}><Sidebar role={role} close={() => setOpen(false)} /></View> : null}
    <View style={{ flex: 1, minWidth: 0 }}>{active && role ? <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.border }}><View style={{ minHeight: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>{!wide && <Pressable accessibilityRole="button" accessibilityLabel="Mở menu điều hướng" accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.pale }}><Text style={{ fontSize: 22, color: colors.primary }}>☰</Text></Pressable>}<View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: colors.ink, fontSize: 15 }}>{current?.label || 'Không gian làm việc'}</Text><Text style={{ color: colors.muted, fontSize: 11 }}>{role === 'COACH' ? 'Huấn luyện viên' : 'Quản lý trung tâm'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Mở tài khoản" onPress={() => router.navigate('/account')} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.primary, fontWeight: '800' }}>{user?.name.slice(0, 2).toUpperCase()}</Text></Pressable></View></SafeAreaView> : null}{children}</View>
    <Modal visible={active && !wide && open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={{ flex: 1, flexDirection: 'row' }}><View accessibilityViewIsModal style={{ width: Math.min(300, width * 0.84) }}><Sidebar role={role || 'COACH'} close={() => setOpen(false)} /><Pressable accessibilityRole="button" accessibilityLabel="Đóng menu" onPress={() => setOpen(false)} style={{ position: 'absolute', right: 14, top: 18, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontSize: 22 }}>×</Text></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel="Đóng menu điều hướng" onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#0007' }} /></View></Modal>
  </View></StaffShellContext.Provider>;
}
