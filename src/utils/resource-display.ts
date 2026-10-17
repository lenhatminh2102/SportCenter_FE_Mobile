import { referenceLabel, type Entity, type ResourceKey } from '@/services/operations';
import { resources } from './resources';
export function titleFor(resource: ResourceKey, item: Entity) {
  if (resource === 'schedules') return `${String(item.date || '').slice(0, 10)} · ${String(item.startTime || '')} – ${String(item.endTime || '')}`;
  if (resource === 'attendances') return `${referenceLabel(item.memberId)} · ${String(item.date || '').slice(0, 10)}`;
  const value = item[resources[resource].titleKey];
  return typeof value === 'object' ? referenceLabel(value) : String(value || 'Chưa có tên');
}
const statuses: Record<string, string> = { SCHEDULED: 'Đã lên lịch', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', PENDING_PAYMENT: 'Chờ thanh toán', CONFIRMED: 'Đã xác nhận', PRESENT: 'Có mặt', ABSENT: 'Vắng mặt', NOT_STARTED: 'Chưa bắt đầu', IN_PROGRESS: 'Đang học', DRAFT: 'Bản nháp', APPROVED: 'Đã duyệt', ACTIVE: 'Hoạt động', INACTIVE: 'Tạm dừng' };
export function detailFor(resource: ResourceKey, item: Entity): string {
  const status = statuses[String(item.status)] || String(item.status || '');
  switch (resource) {
    case 'rooms': return `Phòng ${String(item.roomNumber || '')} · ${String(item.capacity || '')} người\n${status}`;
    case 'coaches': return String(item.phone || '');
    case 'subjects': return 'Môn thể thao trên hệ thống';
    case 'courses': return `${status}\n${String(item.description || '')}`;
    case 'lessons': return `Bài ${String(item.order)} · ${referenceLabel(item.learningPathId)}\n${String(item.description || '')}`;
    case 'schedules': return `${referenceLabel(item.classId)} · ${referenceLabel(item.lessonId)}\nPhòng: ${referenceLabel(item.roomId)} · ${status}`;
    case 'activity-logs': return `${referenceLabel(item.userId)}\n${item.createdAt ? new Date(String(item.createdAt)).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' }) : ''}`;
    case 'classes': return `${referenceLabel(item.subjectId)} · ${referenceLabel(item.courseId)}\nHLV: ${referenceLabel(item.coachId)}`;
    case 'class-registrations': return `${referenceLabel(item.memberId)}\n${status}`;
    case 'attendances': return `${referenceLabel(item.classId)} · ${referenceLabel(item.lessonId)}\n${status}`;
    case 'learning-paths': return `${referenceLabel(item.courseId)}\n${String(item.description || '')}`;
    case 'lesson-progress': return `${referenceLabel(item.memberId)}\n${status}`;
    case 'workout-plans': return `${referenceLabel(item.memberId)} · HLV ${referenceLabel(item.coachId)}\n${String(item.plan || '')}\n${status}`;
    case 'workout-results': return `${referenceLabel(item.memberId)} · ${referenceLabel(item.workoutPlanId)}\n${String(item.comment || '')}`;
  }
}
