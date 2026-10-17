import { useCallback } from 'react';
import { coachAttendanceApi } from '@/services/coach-teaching';
import { useApiQuery } from './use-api-query';
export function useScheduleAttendances(token: string, scheduleId: string) {
  const load = useCallback(() => coachAttendanceApi.bySchedule(token, scheduleId), [token, scheduleId]);
  return useApiQuery(load, !!token && !!scheduleId);
}
