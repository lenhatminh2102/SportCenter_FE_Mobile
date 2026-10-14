import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { authApi, type ApiUser } from '@/services/api';
type Member = ApiUser & { name: string };
type Account = { email: string; password: string };
type Auth = { token: string | null; user: Member | null; register: (account: Account) => Promise<void>; login: (email: string, password: string) => Promise<void>; logout: () => void };
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Member | null>(null);
  async function register(account: Account) {
    await authApi.register(account.email, account.password);
  }
  async function login(email: string, password: string) {
    const session = await authApi.login(email, password);
    if (!session?.token) throw new Error('Máy chủ chưa trả về token đăng nhập.');
    const profile = await authApi.me(session.token);
    if (!profile?.id || !profile.email) throw new Error('Thông tin tài khoản từ máy chủ không hợp lệ.');
    if (profile.status !== 'ACTIVE') throw new Error('Tài khoản chưa hoạt động.');
    setToken(session.token);
    setUser({ ...profile, name: profile.email.split('@')[0] });
  }
  return <Context.Provider value={{ token, user, register, login, logout: () => { setToken(null); setUser(null); } }}>{children}</Context.Provider>;
}
export function useAuth() {
  const auth = useContext(Context);
  if (!auth) throw new Error('AuthProvider is required');
  return auth;
}
