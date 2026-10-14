import { useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Button } from './ui';
import { ui } from './styles';
export type GoogleLoginProps = { disabled?: boolean; onBusyChange: (busy: boolean) => void };
export function GoogleLogin({ disabled, onBusyChange }: GoogleLoginProps) {
  const { loginGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const expoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const configured = !!webClientId && (Platform.OS !== 'ios' || !!iosClientId);
  async function signIn() {
    if (pending.current || disabled || !configured || expoGo) return;
    pending.current = true; setBusy(true); onBusyChange(true); setError('');
    try {
      // Lazy import keeps email authentication usable in Expo Go.
      const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId, ...(iosClientId ? { iosClientId } : {}) });
      if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      if (!isSuccessResponse(result)) return;
      if (!result.data.idToken) throw new Error('Google chưa trả về ID token. Kiểm tra Web Client ID.');
      await loginGoogle(result.data.idToken);
      router.replace('/account');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không đăng nhập được bằng Google.'); }
    finally { pending.current = false; setBusy(false); onBusyChange(false); }
  }
  return <View style={{ gap: 10 }}><Button secondary title={busy ? 'Đang kết nối Google…' : 'Tiếp tục với Google'} disabled={disabled || busy || !configured || expoGo} onPress={signIn} />{!configured && <Text style={[ui.body, { fontSize: 12 }]}>Đăng nhập Google chưa được cấu hình Client ID.</Text>}{expoGo && <Text style={[ui.body, { fontSize: 12 }]}>Google Sign-In cần development build; đăng nhập email vẫn dùng được trong Expo Go.</Text>}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}</View>;
}
