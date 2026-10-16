import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { ApiError, authApi, onUnauthorized, type ApiUser, type AuthSession, type GoogleAuthResult } from '@/services/api';
type User = ApiUser & { name: string };
type OtpStatus = { email: string; expiresAt: number; resendAt: number };
type PendingOtp = OtpStatus & { challengeToken: string; idToken: string };
type Auth = {
  token: string | null; user: User | null; sessionMessage: string; pendingOtp: OtpStatus | null;
  register: (account: { email: string; password: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<'otp' | 'authenticated'>;
  verifyGoogleOtp: (otp: string) => Promise<void>;
  resendGoogleOtp: () => Promise<'otp' | 'authenticated'>;
  cancelGoogleOtp: () => void;
  refreshUser: () => Promise<void>; logout: () => void;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<{ token: string; user: User } | null>(null);
  const [sessionMessage, setSessionMessage] = useState('');
  const [pendingOtp, setPendingOtp] = useState<OtpStatus | null>(null);
  const challenge = useRef<PendingOtp | null>(null);
  const currentToken = useRef<string | null>(null);
  const generation = useRef(0);
  const otpBusy = useRef(false);
  function clearChallenge() { challenge.current = null; setPendingOtp(null); }
  useEffect(() => onUnauthorized(token => {
    if (currentToken.current === token) {
      generation.current++; currentToken.current = null; setSession(null);
      setSessionMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }), []);
  function logout() {
    generation.current++; currentToken.current = null; setSession(null); setSessionMessage(''); clearChallenge();
  }
  function cancelGoogleOtp() { generation.current++; clearChallenge(); }
  function startAuthentication() { generation.current++; currentToken.current = null; setSession(null); clearChallenge(); return generation.current; }
  async function finishAuthentication(result: AuthSession, version: number) {
    if (!result?.token) throw new Error('Máy chủ chưa trả về token đăng nhập.');
    const profile = await authApi.me(result.token);
    if (version !== generation.current) throw new Error('Yêu cầu đăng nhập đã bị hủy.');
    if (!profile?.id || !profile.email) throw new Error('Thông tin tài khoản từ máy chủ không hợp lệ.');
    if (profile.status !== 'ACTIVE') throw new Error('Tài khoản chưa hoạt động.');
    currentToken.current = result.token;
    setSession({ token: result.token, user: { ...profile, name: profile.email.split('@')[0] } });
    setSessionMessage(''); clearChallenge();
  }
  async function acceptGoogleResult(result: GoogleAuthResult, idToken: string, version: number, startedAt: number): Promise<'otp' | 'authenticated'> {
    if (version !== generation.current) throw new Error('Yêu cầu đăng nhập đã bị hủy.');
    if (!result.requiresOTP) { await finishAuthentication(result, version); return 'authenticated'; }
    const pending = { email: result.email, expiresAt: startedAt + 5 * 60_000, resendAt: Date.now() + 60_000 };
    challenge.current = { ...pending, idToken, challengeToken: result.challengeToken };
    setPendingOtp(pending);
    return 'otp';
  }
  async function loginGoogle(idToken: string) {
    const version = startAuthentication(); const startedAt = Date.now();
    return acceptGoogleResult(await authApi.google(idToken), idToken, version, startedAt);
  }
  async function verifyGoogleOtp(otp: string) {
    if (otpBusy.current) throw new Error('Yêu cầu đang được xử lý.');
    if (!/^\d{6}$/.test(otp)) throw new Error('Nhập đủ 6 chữ số trong email.');
    const pending = challenge.current;
    if (!pending) throw new Error('Phiên xác minh không còn. Vui lòng đăng nhập Google lại.');
    if (Date.now() >= pending.expiresAt) throw new Error('Mã đã hết hạn. Vui lòng gửi lại mã.');
    const version = generation.current; otpBusy.current = true;
    try { await finishAuthentication(await authApi.verifyGoogleOtp(pending.challengeToken, otp), version); }
    finally { otpBusy.current = false; }
  }
  async function resendGoogleOtp(): Promise<'otp' | 'authenticated'> {
    if (otpBusy.current) throw new Error('Yêu cầu đang được xử lý.');
    const pending = challenge.current;
    if (!pending) throw new Error('Vui lòng đăng nhập Google lại.');
    if (Date.now() < pending.resendAt) throw new Error('Vui lòng đợi trước khi gửi lại mã.');
    const version = generation.current; const startedAt = Date.now(); otpBusy.current = true;
    try { return await acceptGoogleResult(await authApi.google(pending.idToken), pending.idToken, version, startedAt); }
    catch (error) {
      if (error instanceof ApiError && error.status === 429 && challenge.current === pending && version === generation.current) {
        const next = { ...pending, resendAt: Date.now() + 60_000 }; challenge.current = next;
        setPendingOtp({ email: next.email, expiresAt: next.expiresAt, resendAt: next.resendAt });
      }
      throw error;
    } finally { otpBusy.current = false; }
  }
  async function refreshUser() {
    const token = currentToken.current; if (!token) return;
    const profile = await authApi.me(token); if (currentToken.current !== token) return;
    if (profile.status !== 'ACTIVE') { logout(); throw new Error('Tài khoản chưa hoạt động.'); }
    setSession({ token, user: { ...profile, name: profile.email.split('@')[0] } });
  }
  return <Context.Provider value={{
    token: session?.token ?? null, user: session?.user ?? null, sessionMessage, pendingOtp,
    register: async account => { await authApi.register(account.email, account.password); },
    login: async (email, password) => { const version = startAuthentication(); await finishAuthentication(await authApi.login(email, password), version); },
    loginGoogle, verifyGoogleOtp, resendGoogleOtp, cancelGoogleOtp, refreshUser, logout,
  }}>{children}</Context.Provider>;
}
export function useAuth() { const auth = useContext(Context); if (!auth) throw new Error('AuthProvider is required'); return auth; }
