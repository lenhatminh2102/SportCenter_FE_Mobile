import { entityId, referenceId, type Entity } from '@/services/operations';
export const enrollmentSteps = ['Chọn lớp', 'Lịch lớp', 'Thông tin', 'Xác nhận', 'Thanh toán'];
export const enrollmentRoles = ['MEMBER', 'RECEPTIONIST', 'CENTER_MANAGER'];
export function upcomingClassSchedules(items: Entity[], classId: string, now = new Date()) {
  return items.filter(item => referenceId(item.classId) === classId && item.status === 'SCHEDULED' && Date.parse(`${String(item.date).slice(0, 10)}T${String(item.startTime)}:00+07:00`) > now.getTime()).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
}
export const scheduleSignature = (items: Entity[]) => items.map(item => [entityId(item), String(item.date).slice(0, 10), item.startTime, item.endTime, referenceId(item.roomId)].join('|')).sort().join(';');
export const enrollmentFor = (items: Entity[], classId: string, memberId: string) => items.find(item => referenceId(item.classId) === classId && referenceId(item.memberId) === memberId);
export function enrollmentConflicts(schedules: Entity[], registrations: Entity[], classId: string, memberId: string, now = new Date()) {
  const ownClasses = new Set(registrations.filter(item => referenceId(item.memberId) === memberId && item.status === 'CONFIRMED' && referenceId(item.classId) !== classId).map(item => referenceId(item.classId)));
  const own = schedules.filter(item => item.status === 'SCHEDULED' && ownClasses.has(referenceId(item.classId)));
  return upcomingClassSchedules(schedules, classId, now).flatMap(candidate => own.filter(booked => String(booked.date).slice(0, 10) === String(candidate.date).slice(0, 10) && String(candidate.startTime) < String(booked.endTime) && String(booked.startTime) < String(candidate.endTime)).map(booked => ({ candidate, booked })));
}
export function assertEnrollmentCourse(course?: Entity) {
  if (!course || course.status !== 'ACTIVE') throw new Error('Khóa học chưa mở đăng ký. Vui lòng chọn lớp khác.');
  if (typeof course.price !== 'number' || !Number.isFinite(course.price) || course.price <= 0) throw new Error('Khóa học chưa có học phí phù hợp để thanh toán. Vui lòng liên hệ trung tâm.');
}
export function assertResumableRegistration(item: Entity) {
  if (item.status === 'CONFIRMED') throw new Error('Hội viên đã tham gia lớp này. Mở đăng ký của tôi để xem lịch học.');
  if (item.status === 'CANCELLED') throw new Error('Đăng ký lớp này đã hủy. Liên hệ trung tâm để đăng ký lại.');
  if (item.status !== 'PENDING_PAYMENT' || !entityId(item)) throw new Error('Đăng ký hiện không thể tiếp tục thanh toán.');
}
