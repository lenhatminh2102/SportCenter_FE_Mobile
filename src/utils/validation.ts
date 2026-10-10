export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const validPhone = (value: string) => /^(0\d{9}|\+84\d{9})$/.test(value.replace(/[\s.-]/g, ''));
export function passwordStrength(value: string) {
  return value.length < 6 ? 'Yếu' : value.length >= 10 && /[A-Z]/.test(value) && /\d/.test(value) ? 'Mạnh' : 'Trung bình';
}
