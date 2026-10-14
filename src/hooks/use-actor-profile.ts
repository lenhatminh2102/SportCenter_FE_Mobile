import { useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { useApiQuery } from './use-api-query';
import { coachesApi, referenceId, type Entity } from '@/services/operations';
import { membersApi } from '@/services/members';
export function useActorProfile(enabled = true) {
  const { user, token } = useAuth();
  const role = user?.role;
  const userId = user?.id;
  const load = useCallback(async (): Promise<Entity> => {
    if (role === 'MEMBER') return { ...await membersApi.me(token!) };
    const coaches = await coachesApi.list(token!);
    const coach = coaches.find(item => referenceId(item.userId) === userId);
    if (!coach) throw new Error('Tài khoản chưa có hồ sơ huấn luyện viên. Liên hệ quản lý để tạo hồ sơ.');
    return coach;
  }, [token, role, userId]);
  return useApiQuery(load, enabled && !!token && (role === 'MEMBER' || role === 'COACH'));
}
