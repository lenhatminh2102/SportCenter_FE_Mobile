import { Platform } from 'react-native';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000')).replace(/\/+$/, '');
export type ApiUser = { id: string; email: string; role: string; status: string };
export type AuthSession = { token: string; user: ApiUser };
export type GoogleAuthResult = ({ requiresOTP: false } & AuthSession) | { requiresOTP: true; email: string; challengeToken: string };
export function parseGoogleAuth(result: { requiresOTP?: boolean; data?: unknown }): GoogleAuthResult {
  const data = result.data as Partial<AuthSession> & { email?: string; challengeToken?: string } | undefined;
  if (result.requiresOTP === true) {
    if (!data?.email || !data.challengeToken) throw new Error('Máy chủ chưa trả về thông tin xác minh OTP.');
    return { requiresOTP: true, email: data.email, challengeToken: data.challengeToken };
  }
  if (!data?.token || !data.user) throw new Error('Máy chủ chưa trả về phiên đăng nhập Google hợp lệ.');
  return { requiresOTP: false, token: data.token, user: data.user };
}
type Envelope<T> = { requiresOTP?: boolean; success: boolean; message?: string; data?: T };
type RequestOptions = { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; token?: string };
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'ApiError'; }
}
const unauthorizedListeners = new Set<(token: string) => void>();
export function onUnauthorized(listener: (token: string) => void) {
  unauthorizedListeners.add(listener);
  return () => { unauthorizedListeners.delete(listener); };
}
export async function requestEnvelope<T>(path: string, options: RequestOptions = {}): Promise<Envelope<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method || (options.body === undefined ? 'GET' : 'POST'),
      headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: controller.signal,
    });
    if (response.status === 401 && options.token) unauthorizedListeners.forEach(listener => listener(options.token!));
    if (response.status === 204 && response.ok) return { success: true };
    let result: Envelope<T>;
    try { result = await response.json(); } catch { throw new ApiError(`Máy chủ trả về dữ liệu không hợp lệ (HTTP ${response.status}).`, response.status); }
    if (!response.ok || !result || result.success !== true) throw new ApiError(result?.message || `Yêu cầu thất bại (HTTP ${response.status}).`, response.status);
    return result;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Kết nối quá thời gian. Vui lòng thử lại.');
    if (error instanceof TypeError) throw new Error('Không kết nối được backend. Kiểm tra địa chỉ API và kết nối mạng.');
    throw error;
  } finally { clearTimeout(timer); }
}
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await requestEnvelope<T>(path, options)).data as T;
}
export const authApi = {
  register: (email: string, password: string) => request<ApiUser>('/api/auth/register', { body: { email: email.trim().toLowerCase(), password, role: 'MEMBER' } }),
  login: (email: string, password: string) => request<AuthSession>('/api/auth/login', { body: { email: email.trim().toLowerCase(), password } }),
  google: async (idToken: string) => parseGoogleAuth(await requestEnvelope<AuthSession | { email: string; challengeToken: string }>('/api/auth/google', { body: { idToken } })),
  verifyGoogleOtp: (challengeToken: string, otp: string) => request<AuthSession>('/api/auth/google/verify-otp', { body: { challengeToken, otp } }),
  me: (token: string) => request<ApiUser>('/api/auth/me', { token }),
};
