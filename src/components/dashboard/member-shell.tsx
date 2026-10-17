import type { PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/context/auth';
import { isMemberPage, activeMemberTab, memberTabs } from '@/utils/member-navigation';
import { colors } from '@/data/sport';
import { MemberShellContext } from '@/context/member-shell';
export function MemberShell({ children }: PropsWithChildren) {
  const { user } = useAuth(); const path = usePathname();
  const active = user?.role === 'MEMBER' && isMemberPage(path);
  const selected = activeMemberTab(path);
  return <MemberShellContext.Provider value={active}><View style={{ flex: 1, backgroundColor: active ? colors.public : 'transparent' }}><View style={{ flex: 1, minHeight: 0 }}>{children}</View>{active && <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: colors.public, borderTopWidth: 1, borderTopColor: colors.border }}><View style={{ flexDirection: 'row', width: '100%', maxWidth: 760, alignSelf: 'center', paddingVertical: 6 }}>{memberTabs.map(tab => <Pressable key={tab.path} accessibilityRole="tab" accessibilityState={{ selected: selected === tab.path }} onPress={() => router.navigate(tab.href)} style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 }}><Text style={{ fontSize: 23, color: selected === tab.path ? colors.primary : colors.muted }}>{tab.symbol}</Text><Text style={{ fontSize: 11, fontWeight: selected === tab.path ? '800' : '500', color: selected === tab.path ? colors.primary : colors.muted }}>{tab.label}</Text></Pressable>)}</View></SafeAreaView>}</View></MemberShellContext.Provider>;
}
