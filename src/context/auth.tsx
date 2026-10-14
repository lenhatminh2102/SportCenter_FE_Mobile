import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { authApi, onUnauthorized, type ApiUser, type AuthSession } from '@/services/api';
type User = ApiUser & { name: string };
type Auth = {
  token: string | null;
  user: User | null;
  sessionMessage: string;
  register: (account: { email: string; password: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<{ token: string; user: User } | null>(null);
  const [sessionMessage, setSessionMessage] = useState('');
  const currentToken = useRef<string | null>(null);
  const generation = useRef(0);
  useEffect(() => onUnauthorized(token => {
    if (currentToken.current === token) {
      generation.current++;
      currentToken.current = null;
      setSession(null);
      setSessionMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }), []);
  function logout() {
    generation.current++;
    currentToken.current = null;
    setSession(null);
    setSessionMessage('');
  }
  async function authenticate(getSession: () => Promise<AuthSession>) {
    const version = ++generation.current;
    const result = await getSession();
    if (!result?.token) throw new Error('Máy chủ chưa trả về token đăng nhập.');
    const profile = await authApi.me(result.token);
    if (!profile?.id || !profile.email) throw new Error('Thông tin tài khoản từ máy chủ không hợp lệ.');
    if (profile.status !== 'ACTIVE') throw new Error('Tài khoản chưa hoạt động.');
    if (version !== generation.current) throw new Error('Yêu cầu đăng nhập đã bị hủy.');
    currentToken.current = result.token;
    setSession({ token: result.token, user: { ...profile, name: profile.email.split('@')[0] } });
    setSessionMessage('');
  }
  async function refreshUser() {
    const token = currentToken.current;
    if (!token) return;
    const profile = await authApi.me(token);
    if (currentToken.current !== token) return;
    if (profile.status !== 'ACTIVE') { logout(); throw new Error('Tài khoản chưa hoạt động.'); }
    setSession({ token, user: { ...profile, name: profile.email.split('@')[0] } });
  }
  return <Context.Provider value={{
    token: session?.token ?? null, user: session?.user ?? null, sessionMessage,
    register: async account => { await authApi.register(account.email, account.password); },
    login: (email, password) => authenticate(() => authApi.login(email, password)),
    loginGoogle: idToken => authenticate(() => authApi.google(idToken)),
    refreshUser, logout,
  }}>{children}</Context.Provider>;
}
export function useAuth() {
  const auth = useContext(Context);
  if (!auth) throw new Error('AuthProvider is required');
  return auth;
}
