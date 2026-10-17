import { useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { useApiQuery } from './use-api-query';
import { coachesApi, type Entity } from '@/services/operations';
import { membersApi } from '@/services/members';
export function useActorProfile(enabled = true) {
  const { user, token } = useAuth();
  const role = user?.role;
  const load = useCallback(async (): Promise<Entity> => {
    if (role === 'MEMBER') return { ...await membersApi.me(token!) };
    return coachesApi.me(token!);
  }, [token, role]);
  return useApiQuery(load, enabled && !!token && (role === 'MEMBER' || role === 'COACH'));
}
