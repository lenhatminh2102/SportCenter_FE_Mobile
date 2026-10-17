import { ApiError } from './api';
import { classesApi, schedulesApi, coursesApi, classRegistrationsApi, entityId, referenceId } from './operations';
import { assertEnrollmentCourse, assertResumableRegistration, enrollmentFor, enrollmentConflicts, scheduleSignature, upcomingClassSchedules } from '@/utils/enrollment';
export class ScheduleChangedError extends Error {}
export async function saveEnrollment(token: string, input: { classId: string; memberId: string; confirmedSchedule: string }) {
  const registrations = await classRegistrationsApi.list(token);
  const existing = enrollmentFor(registrations, input.classId, input.memberId);
  if (existing) { assertResumableRegistration(existing); return existing; }
  const [classes, courses, schedules] = await Promise.all([classesApi.list(token), coursesApi.list(token), schedulesApi.list(token)]);
  const selected = classes.find(item => entityId(item) === input.classId);
  if (!selected) throw new Error('Lớp học không còn tồn tại. Vui lòng chọn lại.');
  assertEnrollmentCourse(courses.find(item => entityId(item) === referenceId(selected.courseId)));
  const sessions = upcomingClassSchedules(schedules, input.classId);
  if (!sessions.length || scheduleSignature(sessions) !== input.confirmedSchedule) throw new ScheduleChangedError('Lịch lớp đã thay đổi. Vui lòng kiểm tra và xác nhận lại lịch.');
  if (enrollmentConflicts(schedules, registrations, input.classId, input.memberId).length) throw new Error('Lịch lớp trùng với lớp hội viên đã được xác nhận. Vui lòng chọn lớp khác.');
  try { return await classRegistrationsApi.create(token, { classId: input.classId, memberId: input.memberId }); }
  catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const record = enrollmentFor(await classRegistrationsApi.list(token), input.classId, input.memberId);
      if (record) { assertResumableRegistration(record); return record; }
    }
    throw error;
  }
}
