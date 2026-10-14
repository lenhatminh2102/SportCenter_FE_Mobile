const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function modules(fetch) {
  const cache = {};
  function load(name) {
    if (cache[name]) return cache[name];
    const context = { exports: {}, fetch, process: { env: {} }, AbortController, setTimeout, clearTimeout, TypeError, require: dependency => {
      if (dependency === 'react-native') return { Platform: { OS: 'web' } };
      const aliases = { './api': 'src/services/api.ts', './validation': 'src/utils/validation.ts', './training-resources': 'src/utils/training-resources.ts', '@/services/operations': 'src/services/operations.ts' };
      return load(aliases[dependency]);
    } };
    cache[name] = context.exports;
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(name, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
    return context.exports;
  }
  return { operations: load('src/services/operations.ts'), schema: load('src/utils/resources.ts'), api: load('src/services/api.ts'), access: load('src/utils/resource-access.ts') };
}
const id = '507f1f77bcf86cd799439011';
const samples = {
  classes: { name: 'Yoga Class', subjectId: id, courseId: id, coachId: id },
  'class-registrations': { classId: id, memberId: id, status: 'CANCELLED' },
  attendances: { memberId: id, classId: id, lessonId: id, date: '2026-10-14', status: 'PRESENT' },
  'learning-paths': { courseId: id, name: 'Yoga Path', description: 'Basics' },
  'lesson-progress': { memberId: id, lessonId: id, status: 'COMPLETED' },
  'workout-plans': { coachId: id, memberId: id, classId: id, goal: 'Fitness', level: 'BEGINNER', plan: 'Squat 3x10', source: 'COACH', status: 'DRAFT' },
  'workout-results': { workoutPlanId: id, memberId: id, result: 'Completed', comment: 'Good' },
  coaches: { userId: id, fullName: 'Coach Test', phone: '0901234567' },
  subjects: { name: 'Yoga' },
  courses: { name: 'Yoga Basics', description: 'Intro', status: 'ACTIVE' },
  lessons: { learningPathId: id, title: 'Lesson 1', description: 'Intro', order: 1 },
  schedules: { classId: id, lessonId: id, date: '2026-10-14', startTime: '08:00', endTime: '09:00', status: 'SCHEDULED' },
  'activity-logs': { userId: id, action: 'Created a lesson' },
};
for (const resource of Object.keys(samples)) {
  const methods = resource === 'activity-logs' ? ['list', 'create'] : ['class-registrations', 'lesson-progress', 'workout-results'].includes(resource) ? ['list', 'create', 'update'] : ['list', 'create', 'update', 'remove'];
  for (const method of methods) test(`${resource}.${method} matches Swagger contract`, async () => {
    const { operations } = modules(async (url, options) => {
      assert.equal(url, `http://localhost:5000/api/${resource}${method === 'update' || method === 'remove' ? '/record%2Fid' : ''}`);
      assert.equal(options.method, { list: 'GET', create: 'POST', update: 'PUT', remove: 'DELETE' }[method]);
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      if (method === 'create' || method === 'update') {
        const expected = { ...samples[resource] };
        if (resource === 'class-registrations' && method === 'create') delete expected.status;
        if (resource === 'coaches' && method === 'update') delete expected.userId;
        assert.deepEqual(JSON.parse(options.body), expected);
      } else assert.equal(options.body, undefined);
      return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) };
    });
    const api = operations.resourceApis[resource];
    if (method === 'create') await api[method]('test-token', { ...samples[resource], password: 'must-not-be-sent' });
    else if (method === 'update') await api[method]('test-token', 'record/id', { ...samples[resource], password: 'must-not-be-sent' });
    else if (method === 'remove') await api[method]('test-token', 'record/id');
    else await api[method]('test-token');
  });
}
test('member personal schedule uses its protected /my endpoint', async () => {
  const { operations } = modules(async (url, options) => {
    assert.equal(url, 'http://localhost:5000/api/schedules/my');
    assert.equal(options.headers.Authorization, 'Bearer member-token');
    return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) };
  });
  await operations.schedulesApi.my('member-token');
});
test('all resource writes require the manager role in UI', () => {
  const { schema } = modules();
  assert.equal(schema.canWriteResource('CENTER_MANAGER'), true);
  for (const role of ['COACH', 'RECEPTIONIST', 'MEMBER', undefined]) assert.equal(schema.canWriteResource(role), false);
});
test('schedule validates real calendar dates and same-day time ranges', () => {
  const { schema } = modules();
  const values = { ...samples.schedules };
  assert.equal(Object.keys(schema.validateResource('schedules', values, false).errors).length, 0);
  assert.ok(schema.validateResource('schedules', { ...values, date: '2026-02-30' }, false).errors.date);
  assert.ok(schema.validateResource('schedules', { ...values, startTime: '25:00' }, false).errors.startTime);
  assert.ok(schema.validateResource('schedules', { ...values, endTime: '07:00' }, false).errors.endTime);
  assert.equal(Object.keys(schema.validateResource('schedules', { ...values, date: '2028-02-29' }, false).errors).length, 0);
});
test('lesson order is a positive integer and is serialized as a number', () => {
  const { schema } = modules();
  const values = { ...samples.lessons, order: '3' };
  assert.equal(schema.validateResource('lessons', values, false).payload.order, 3);
  for (const order of ['0', '-1', '1.5', 'abc']) assert.ok(schema.validateResource('lessons', { ...values, order }, false).errors.order);
});
test('coach edits do not require userId and enum values cannot be forged', () => {
  const { schema } = modules();
  assert.equal(Object.keys(schema.validateResource('coaches', { fullName: 'Coach', phone: '0901234567' }, true).errors).length, 0);
  assert.ok(schema.validateResource('courses', { name: 'Yoga', status: 'ADMIN' }, false).errors.status);
  assert.equal(schema.isResource('toString'), false);
  assert.equal(schema.isResource('unknown'), false);
});
test('populated and missing references normalize safely', () => {
  const { operations, schema } = modules();
  assert.equal(operations.referenceId({ _id: id, title: 'Lesson' }), id);
  assert.equal(operations.referenceLabel({ _id: id, title: 'Lesson' }), 'Lesson');
  assert.equal(operations.referenceId(null), '');
  const values = schema.initialValues('schedules', { classId: { _id: id, name: 'Class' }, lessonId: null, date: '2026-10-14T00:00:00.000Z' });
  assert.equal(values.classId, id); assert.equal(values.lessonId, ''); assert.equal(values.date, '2026-10-14');
});
test('server dependency conflict remains visible with HTTP status', async () => {
  const { operations, api } = modules(async () => ({ ok: false, status: 409, json: async () => ({ success: false, message: 'Course is being used by a learning path' }) }));
  await assert.rejects(operations.coursesApi.remove('token', id), error => error instanceof api.ApiError && error.status === 409 && /learning path/.test(error.message));
});

test('training actions match role-specific backend routes', () => {
  const { access } = modules();
  assert.equal(access.canUseResource('workout-plans', 'CENTER_MANAGER', 'create'), false);
  assert.equal(access.canUseResource('workout-plans', 'COACH', 'create', undefined, id), true);
  assert.equal(access.canUseResource('attendances', 'RECEPTIONIST', 'remove'), true);
  assert.equal(access.canUseResource('attendances', 'MEMBER', 'create', undefined, id), false);
  assert.equal(access.canUseResource('lesson-progress', 'COACH', 'update'), true);
  assert.equal(access.canUseResource('workout-results', 'CENTER_MANAGER', 'create'), false);
  for (const key of ['class-registrations', 'lesson-progress', 'workout-results']) assert.equal(access.canUseResource(key, 'CENTER_MANAGER', 'remove'), false);
});
test('members cannot edit records belonging to other members', () => {
  const { access } = modules();
  assert.equal(access.canUseResource('lesson-progress', 'MEMBER', 'update', { memberId: { _id: id } }, id), true);
  assert.equal(access.canUseResource('lesson-progress', 'MEMBER', 'update', { memberId: 'another-member' }, id), false);
  assert.equal(access.canUseResource('class-registrations', 'MEMBER', 'create'), false);
  assert.equal(access.isOwnRecord('workout-plans', 'COACH', id, { coachId: { _id: id } }), true);
  assert.equal(access.isOwnRecord('workout-results', 'COACH', id, { workoutPlanId: { coachId: { _id: id } } }), true);
});
test('registration status is excluded on creation and validated on update', () => {
  const { schema } = modules();
  const form = { classId: id, memberId: id, status: 'CONFIRMED' };
  assert.equal(schema.validateResource('class-registrations', form, false).payload.status, undefined);
  assert.equal(schema.validateResource('class-registrations', form, true).payload.status, 'CONFIRMED');
  assert.ok(schema.validateResource('lesson-progress', { memberId: id, lessonId: id, status: 'FORGED' }, false).errors.status);
});
test('optional workout class can be cleared without sending an invalid ObjectId', async () => {
  const { operations } = modules(async (url, options) => {
    assert.equal(JSON.parse(options.body).classId, undefined);
    return { ok: true, status: 200, json: async () => ({ success: true, data: {} }) };
  });
  await operations.workoutPlansApi.update('token', id, { ...samples['workout-plans'], classId: '' });
});
