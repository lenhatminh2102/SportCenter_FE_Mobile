import { Platform } from 'react-native';

// Set a LAN address in .env.local when running on a physical phone.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000')).replace(/\/+$/, '');

export type ApiUser = { id: string; email: string; role: string; status: string };
type Envelope<T> = { success: boolean; message?: string; data: T };

export async function request<T>(path: string, options: { body?: unknown; token?: string } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: controller.signal,
    });
    let result: Envelope<T>;
    try { result = await response.json(); } catch { throw new Error(`Máy chủ trả về dữ liệu không hợp lệ (HTTP ${response.status}).`); }
    if (!response.ok || !result.success) throw new Error(result.message || `Yêu cầu thất bại (HTTP ${response.status}).`);
    return result.data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Kết nối quá thời gian. Vui lòng thử lại.');
    if (error instanceof TypeError) throw new Error('Không kết nối được backend. Kiểm tra địa chỉ API và kết nối mạng.');
    throw error;
  } finally { clearTimeout(timer); }
}

export const authApi = {
  register: (email: string, password: string) => request<ApiUser>('/api/auth/register', { body: { email: email.trim().toLowerCase(), password, role: 'MEMBER' } }),
  login: (email: string, password: string) => request<{ token: string; user: ApiUser }>('/api/auth/login', { body: { email: email.trim().toLowerCase(), password } }),
  me: (token: string) => request<ApiUser>('/api/auth/me', { token }),
};
