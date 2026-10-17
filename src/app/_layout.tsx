import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StaffShell } from '@/components/dashboard/staff-shell';
import { MemberShell } from '@/components/dashboard/member-shell';
import { AuthProvider } from '@/context/auth';
export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark" /><StaffShell><MemberShell><Stack screenOptions={{ headerShown: false }} /></MemberShell></StaffShell></AuthProvider></SafeAreaProvider>;
}
