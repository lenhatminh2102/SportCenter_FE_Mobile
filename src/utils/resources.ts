import { trainingResources } from './training-resources';
import { validPhone } from './validation';
import { referenceId, type Entity, type ResourceInput, type ResourceKey } from '@/services/operations';
export type FormField = { key: string; label: string; required?: boolean; type?: 'id' | 'phone' | 'number' | 'date' | 'time' | 'multiline'; options?: { value: string; label: string }[]; createOnly?: boolean; updateOnly?: boolean; relation?: string };
export type ResourceDefinition = { title: string; singular: string; titleKey: string; fields: FormField[] };
export const resources: Record<ResourceKey, ResourceDefinition> = {
  ...trainingResources,
  rooms: { title: 'Phòng tập', singular: 'phòng tập', titleKey: 'name', fields: [
    { key: 'roomNumber', label: 'Mã phòng', required: true }, { key: 'name', label: 'Tên phòng', required: true },
    { key: 'capacity', label: 'Sức chứa', type: 'number', required: true },
    { key: 'status', label: 'Trạng thái', required: true, options: [{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Tạm dừng' }] },
  ] },
  coaches: { title: 'Huấn luyện viên', singular: 'huấn luyện viên', titleKey: 'fullName', fields: [
    { key: 'userId', label: 'User ID tài khoản COACH đã đăng ký', type: 'id', required: true, createOnly: true },
    { key: 'fullName', label: 'Họ và tên', required: true }, { key: 'phone', label: 'Số điện thoại', type: 'phone', required: true },
  ] },
  subjects: { title: 'Môn thể thao', singular: 'môn thể thao', titleKey: 'name', fields: [{ key: 'name', label: 'Tên môn thể thao', required: true }] },
  courses: { title: 'Khóa học', singular: 'khóa học', titleKey: 'name', fields: [
    { key: 'name', label: 'Tên khóa học', required: true }, { key: 'description', label: 'Mô tả', type: 'multiline' },
    { key: 'status', label: 'Trạng thái', required: true, options: [{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Tạm dừng' }] },
  ] },
  lessons: { title: 'Bài học', singular: 'bài học', titleKey: 'title', fields: [
    { key: 'learningPathId', label: 'Lộ trình học', type: 'id', relation: '/api/learning-paths', required: true },
    { key: 'title', label: 'Tên bài học', required: true }, { key: 'description', label: 'Nội dung', type: 'multiline' },
    { key: 'order', label: 'Thứ tự bài (từ 1)', type: 'number', required: true },
  ] },
  schedules: { title: 'Lịch tập', singular: 'lịch tập', titleKey: 'date', fields: [
    { key: 'classId', label: 'Lớp học', type: 'id', relation: '/api/classes', required: true },
    { key: 'lessonId', label: 'Bài học', type: 'id', relation: '/api/lessons', required: true },
    { key: 'roomId', label: 'Phòng tập', type: 'id', relation: '/api/rooms', required: true },
    { key: 'date', label: 'Ngày (YYYY-MM-DD)', type: 'date', required: true },
    { key: 'startTime', label: 'Giờ bắt đầu (HH:mm)', type: 'time', required: true },
    { key: 'endTime', label: 'Giờ kết thúc (HH:mm)', type: 'time', required: true },
    { key: 'status', label: 'Trạng thái', required: true, options: [{ value: 'SCHEDULED', label: 'Đã lên lịch' }, { value: 'COMPLETED', label: 'Hoàn thành' }, { value: 'CANCELLED', label: 'Đã hủy' }] },
  ] },
  'activity-logs': { title: 'Lịch sử thao tác', singular: 'nhật ký', titleKey: 'action', fields: [
    { key: 'userId', label: 'User ID thực hiện thao tác', type: 'id', required: true },
    { key: 'action', label: 'Nội dung thao tác', type: 'multiline', required: true },
  ] },
};
export function isResource(value?: string): value is ResourceKey { return !!value && Object.hasOwn(resources, value); }
export const canWriteResource = (role?: string) => role === 'CENTER_MANAGER';
export function initialValues(resource: ResourceKey, item?: Entity): Record<string, string> {
  return Object.fromEntries(resources[resource].fields.map(field => {
    const value = item?.[field.key];
    return [field.key, field.type === 'id' ? referenceId(value) : field.type === 'date' && typeof value === 'string' ? value.slice(0, 10) : value === undefined || value === null ? field.options?.[0].value || (field.type === 'number' ? '1' : '') : String(value)];
  }));
}
export function validateResource(resource: ResourceKey, values: Record<string, string>, editing: boolean) {
  const errors: Record<string, string> = {};
  const payload: ResourceInput = {};
  for (const field of resources[resource].fields) {
    if (editing && field.createOnly || !editing && field.updateOnly) continue;
    const value = (values[field.key] || '').trim();
    payload[field.key] = value;
    if (field.required && !value) errors[field.key] = 'Vui lòng nhập thông tin này.';
    else if (value && field.type === 'id' && !/^[a-f\d]{24}$/i.test(value)) errors[field.key] = 'Chọn bản ghi hoặc nhập ID hợp lệ gồm 24 ký tự.';
    else if (value && field.type === 'phone' && !validPhone(value)) errors[field.key] = 'Số điện thoại Việt Nam chưa hợp lệ.';
    else if (field.type === 'number') {
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number < 1) errors[field.key] = 'Nhập số nguyên từ 1 trở lên.';
      else payload[field.key] = number;
    } else if (value && field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) errors[field.key] = 'Ngày chưa hợp lệ, dùng YYYY-MM-DD.';
    else if (value && field.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) errors[field.key] = 'Giờ chưa hợp lệ, dùng HH:mm (24 giờ).';
    else if (field.options && !field.options.some(option => option.value === value)) errors[field.key] = 'Vui lòng chọn giá trị hợp lệ.';
  }
  if (resource === 'schedules' && !errors.startTime && !errors.endTime && values.startTime >= values.endTime) errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.';
  return { errors, payload };
}
