import { coachesApi, classesApi, classRegistrationsApi, entityId } from './operations';
import { buildCoachRoster } from '@/utils/coach-roster';
export async function loadCoachRoster(token: string) {
  const [coach, classes, registrations] = await Promise.all([coachesApi.me(token), classesApi.list(token), classRegistrationsApi.list(token)]);
  const coachId = entityId(coach);
  if (!coachId) throw new Error('Không tải được hồ sơ huấn luyện viên.');
  if (!Array.isArray(classes) || !Array.isArray(registrations)) throw new Error('Danh sách học viên từ máy chủ không hợp lệ.');
  return buildCoachRoster(registrations, classes, coachId);
}
