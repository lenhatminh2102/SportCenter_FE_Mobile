import { request } from './api';
export type MemberLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type MemberInput = { fullName: string; phone: string; goal: string; level: MemberLevel };
export type MemberProfile = MemberInput & { id?: string; _id?: string; userId: string; createdAt?: string; updatedAt?: string };
export const memberId = (member: MemberProfile) => member.id || member._id || '';
function body(input: MemberInput): MemberInput {
  return { fullName: input.fullName.trim(), phone: input.phone.replace(/[\s.-]/g, ''), goal: input.goal.trim(), level: input.level };
}
export const membersApi = {
  me: (token: string) => request<MemberProfile>('/api/members/me', { token }),
  createMe: (token: string, input: MemberInput) => request<MemberProfile>('/api/members/me', { token, body: body(input) }),
  updateMe: (token: string, input: MemberInput) => request<MemberProfile>('/api/members/me', { token, method: 'PUT', body: body(input) }),
  list: (token: string) => request<MemberProfile[]>('/api/members', { token }),
  create: (token: string, userId: string, input: MemberInput) => request<MemberProfile>('/api/members', { token, body: { ...body(input), userId: userId.trim() } }),
  update: (token: string, id: string, input: MemberInput) => request<MemberProfile>(`/api/members/${encodeURIComponent(id)}`, { token, method: 'PUT', body: body(input) }),
  remove: (token: string, id: string) => request<void>(`/api/members/${encodeURIComponent(id)}`, { token, method: 'DELETE' }),
};
