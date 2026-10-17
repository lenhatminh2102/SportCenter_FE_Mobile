import type { Href } from 'expo-router';
export type StaffRole = 'COACH' | 'CENTER_MANAGER';
export const isStaffRole = (role?: string): role is StaffRole => role === 'COACH' || role === 'CENTER_MANAGER';
export const roleHome = (role?: string): '/coach' | '/manager' | '/account' => role === 'COACH' ? '/coach' : role === 'CENTER_MANAGER' ? '/manager' : '/account';
export type StaffMenuItem = { label: string; href: Href; path: string; group: string; symbol: string };
const resource = (key: string, label: string, group: string, symbol: string): StaffMenuItem => ({ label, href: { pathname: '/workspace/[resource]', params: { resource: key } }, path: `/workspace/${key}`, group, symbol });
export function staffMenu(role: StaffRole): StaffMenuItem[] {
  const home = { label: 'Tổng quan', href: roleHome(role), path: roleHome(role), group: 'KHÔNG GIAN LÀM VIỆC', symbol: '▦' };
  const common = [resource('schedules', role === 'COACH' ? 'Lịch dạy của tôi' : 'Lịch tập', 'VẬN HÀNH', '◷'), resource('attendances', 'Điểm danh', 'VẬN HÀNH', '✓')];
  const training = [resource('workout-plans', 'Kế hoạch tập luyện', 'TẬP LUYỆN', '↗'), resource('workout-results', 'Kết quả tập luyện', 'TẬP LUYỆN', '◈'), resource('lesson-progress', 'Tiến độ bài học', 'TẬP LUYỆN', '◴')];
  const account: StaffMenuItem = { label: 'Tài khoản', href: '/account', path: '/account', group: 'CÁ NHÂN', symbol: '○' };
  const inbox: StaffMenuItem[] = [{ label: 'Thông báo', href: '/notifications', path: '/notifications', group: 'KẾT NỐI', symbol: '◌' }];
  const service: StaffMenuItem[] = [{ label: 'Thanh toán', href: '/payments', path: '/payments', group: 'DỊCH VỤ', symbol: '₫' }, { label: 'Hỗ trợ hội viên', href: '/support', path: '/support', group: 'DỊCH VỤ', symbol: '?' }];
  if (role === 'COACH') return [home, { label: 'Học viên của tôi', href: '/coach-students', path: '/coach-students', group: 'VẬN HÀNH', symbol: '♧' }, ...common, resource('classes', 'Lớp của tôi', 'VẬN HÀNH', '▤'), ...training, resource('lessons', 'Bài học', 'TẬP LUYỆN', '≡'), ...inbox, account];
  return [home, { label: 'Hội viên', href: '/members', path: '/members', group: 'VẬN HÀNH', symbol: '♧' }, resource('coaches', 'Huấn luyện viên', 'VẬN HÀNH', '◇'), resource('rooms', 'Phòng tập', 'VẬN HÀNH', '▧'), resource('classes', 'Lớp học', 'VẬN HÀNH', '▤'), ...common, resource('class-registrations', 'Đăng ký lớp', 'VẬN HÀNH', '＋'), resource('subjects', 'Môn thể thao', 'NỘI DUNG', '◉'), resource('courses', 'Khóa học', 'NỘI DUNG', '▣'), resource('learning-paths', 'Lộ trình học', 'NỘI DUNG', '⌁'), resource('lessons', 'Bài học', 'NỘI DUNG', '≡'), ...training, resource('activity-logs', 'Lịch sử thao tác', 'HỆ THỐNG', '↺'), ...service, ...inbox, account];
}
export function activeMenuItem(pathname: string, item: StaffMenuItem) { return pathname === item.path || pathname.startsWith(`${item.path}/`); }
export function isStaffPage(pathname: string) { return ['/coach', '/coach-students', '/manager', '/account', '/operations', '/members', '/workspace', '/payments', '/payment-edit', '/notifications', '/notification-compose', '/support'].some(path => pathname === path || pathname.startsWith(`${path}/`)); }
