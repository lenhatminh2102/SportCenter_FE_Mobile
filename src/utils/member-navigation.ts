import type { Href } from 'expo-router';
export const memberTabs: { label: string; symbol: string; href: Href; path: string }[] = [
  { label: 'Trang chủ', symbol: '⌂', href: '/member', path: '/member' },
  { label: 'Lớp học', symbol: '▤', href: { pathname: '/workspace/[resource]', params: { resource: 'classes' } }, path: '/workspace/classes' },
  { label: 'Lịch của tôi', symbol: '◷', href: { pathname: '/workspace/[resource]', params: { resource: 'schedules' } }, path: '/workspace/schedules' },
  { label: 'Tài khoản', symbol: '○', href: '/account', path: '/account' },
];
export const isMemberPage = (path: string) => ['/member', '/account', '/profile', '/operations', '/workspace', '/payments', '/payment-edit', '/support', '/notifications', '/class-detail', '/pricing'].some(item => path === item || path.startsWith(`${item}/`));
export function activeMemberTab(path: string) {
  if (path === '/class-detail') return '/workspace/classes';
  if (memberTabs.some(tab => tab.path === path || path.startsWith(`${tab.path}/`))) return memberTabs.find(tab => path === tab.path || path.startsWith(`${tab.path}/`))!.path;
  return '';
}
