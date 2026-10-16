import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Button } from './ui';
import { ui } from './styles';
import type { GoogleLoginProps } from './google-login';
type GoogleIdentity = { accounts: { id: { initialize: (options: { client_id: string; callback: (result: { credential?: string }) => void }) => void; renderButton: (node: HTMLElement, options: { theme: string; size: string; text: string; shape: string; width: number; locale: string }) => void } } };
let scriptPromise: Promise<GoogleIdentity> | null = null;
function loadGoogle(): Promise<GoogleIdentity> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    script.onload = () => {
      const google = (window as Window & { google?: GoogleIdentity }).google;
      if (google) resolve(google); else { scriptPromise = null; reject(new Error('Không tải được Google Sign-In.')); }
    };
    script.onerror = () => { script.remove(); scriptPromise = null; reject(new Error('Không tải được Google Sign-In. Kiểm tra mạng rồi tải lại trang.')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
export function GoogleLogin({ disabled, onBusyChange }: GoogleLoginProps) {
  const { loginGoogle } = useAuth();
  const host = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const credentialHandler = useRef<(result: { credential?: string }) => void>(() => {});
  useEffect(() => {
    credentialHandler.current = async result => {
      if (disabled || pending.current) return;
      if (!result.credential) { setError('Google chưa trả về ID token.'); return; }
      pending.current = true; setBusy(true); onBusyChange(true); setError('');
      try { const next = await loginGoogle(result.credential); router.replace(next === 'otp' ? '/verify-otp' : '/dashboard'); }
      catch (e) { setError((e as Error).message); }
      finally { pending.current = false; setBusy(false); onBusyChange(false); }
    };
  }, [disabled, loginGoogle, onBusyChange]);
  useEffect(() => {
    if (!clientId) return;
    let active = true;
    void loadGoogle().then(google => {
      if (!active || !host.current) return;
      google.accounts.id.initialize({ client_id: clientId, callback: result => credentialHandler.current(result) });
      google.accounts.id.renderButton(host.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: Math.min(400, host.current.clientWidth || 320), locale: 'vi' });
    }).catch(e => { if (active) setError((e as Error).message); });
    return () => { active = false; };
  }, [clientId]);
  return <View style={{ gap: 10 }}>{clientId ? <div ref={host} aria-disabled={disabled || busy} style={{ pointerEvents: disabled || busy ? 'none' : 'auto', opacity: disabled || busy ? 0.5 : 1, minHeight: 44 }} /> : <><Button secondary title="G · Tiếp tục với Google" disabled onPress={() => {}} /><Text style={[ui.body, { fontSize: 12 }]}>Đăng nhập Google đang chờ cấu hình.</Text></>}{busy && <Text style={ui.body}>Đang kết nối Google…</Text>}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}</View>;
}
