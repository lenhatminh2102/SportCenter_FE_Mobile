import { createContext, useContext, useState, type PropsWithChildren } from 'react';
type Member = { name: string; email: string; phone: string; plan: string };
type Account = Member & { password: string };
type Auth = { user: Member | null; register: (account: Account) => void; login: (email: string, password: string) => void; logout: () => void };
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [user, setUser] = useState<Member | null>(null);
  function register(account: Account) {
    const email = account.email.trim().toLowerCase();
    if (accounts.some(a => a.email === email)) throw new Error('Email này đã được đăng ký trong phiên demo.');
    setAccounts(current => [...current, { ...account, name: account.name.trim(), email }]);
  }
  function login(email: string, password: string) {
    const account = accounts.find(a => a.email === email.trim().toLowerCase() && a.password === password);
    if (!account) throw new Error('Email hoặc mật khẩu không đúng. Hãy đăng ký tài khoản demo trước.');
    const { password: omitted, ...member } = account;
    void omitted;
    setUser(member);
  }
  return <Context.Provider value={{ user, register, login, logout: () => setUser(null) }}>{children}</Context.Provider>;
}
export function useAuth() {
  const auth = useContext(Context);
  if (!auth) throw new Error('AuthProvider is required');
  return auth;
}
