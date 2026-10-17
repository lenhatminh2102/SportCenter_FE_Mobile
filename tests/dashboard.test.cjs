const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const context = { exports: {}, Error, require: name => dependencies[name] };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.exports;
}
const ref = value => typeof value === 'string' ? value : value?.id || value?._id || '';
function dashboard(dependencies = {}) {
  return load('src/services/dashboard.ts', { './operations': { entityId: ref, referenceId: ref, ...dependencies }, './members': { membersApi: { list: async () => [] } } });
}
const now = new Date('2026-10-14T00:00:00Z');
test('staff roles have separate landing pages and menu entries', () => {
  const nav = load('src/utils/staff-navigation.ts');
  assert.equal(nav.roleHome('COACH'), '/coach');
  assert.equal(nav.roleHome('CENTER_MANAGER'), '/manager');
  assert.equal(nav.roleHome('MEMBER'), '/member');
  assert.equal(nav.isStaffRole('RECEPTIONIST'), false);
  assert.equal(nav.staffMenu('COACH').some(item => item.path === '/members'), false);
  assert.equal(nav.staffMenu('CENTER_MANAGER').some(item => item.path === '/members'), true);
  assert.equal(nav.activeMenuItem('/workspace/classes/edit', { path: '/workspace/classes' }), true);
  assert.equal(nav.activeMenuItem('/workspace/classes-other', { path: '/workspace/classes' }), false);
  assert.equal(nav.isStaffPage('/login'), false);
});
test('coach dashboard scopes classes, students, schedules and results', () => {
  const data = dashboard().summarizeDashboard('COACH', 'user-a', {
    coaches: [{ _id: 'coach-a', userId: { _id: 'user-a' }, fullName: 'Coach A' }],
    classes: [{ _id: 'class-a', coachId: 'coach-a' }, { _id: 'class-b', coachId: 'coach-b' }],
    schedules: [{ _id: 's1', classId: { _id: 'class-a' }, date: '2026-10-14', startTime: '08:00', status: 'SCHEDULED' }, { _id: 's2', classId: 'class-b', date: '2026-10-14', status: 'SCHEDULED' }, { _id: 's3', classId: 'class-a', date: '2026-10-14', status: 'CANCELLED' }],
    registrations: [{ classId: 'class-a', memberId: 'm1', status: 'CONFIRMED' }, { classId: 'class-a', memberId: 'm2', status: 'PENDING_PAYMENT' }],
    plans: [{ _id: 'p1', coachId: 'coach-a', memberId: 'm1', status: 'DRAFT' }, { _id: 'p2', coachId: 'coach-b', memberId: 'm3', status: 'DRAFT' }],
    results: [{ _id: 'r1', workoutPlanId: 'p1' }, { _id: 'r2', workoutPlanId: 'p2' }],
  }, now);
  assert.equal(data.name, 'Coach A');
  assert.deepEqual(Array.from(data.metrics, metric => metric.value), [1, 1, 1, 1]);
  assert.equal(data.sessions.length, 1); assert.equal(data.activity.length, 1);
  assert.equal(data.week[0].count, 1);
});
test('manager metrics distinguish unavailable data from a real zero', () => {
  const api = dashboard();
  const partial = api.summarizeDashboard('CENTER_MANAGER', 'manager', { members: [], registrations: [{ status: 'PENDING_PAYMENT' }, { status: 'CONFIRMED' }] }, now);
  assert.deepEqual(Array.from(partial.metrics, metric => metric.value), [0, null, null, 1]);
  assert.equal(partial.week[0].count, null);
});
test('dashboard dates follow Bangkok timezone and omit past/cancelled sessions', () => {
  const api = dashboard();
  assert.equal(api.bangkokDate(new Date('2026-10-13T18:00:00Z')), '2026-10-14');
  const result = api.summarizeDashboard('CENTER_MANAGER', 'manager', { schedules: [
    { _id: 'past', date: '2026-10-14', startTime: '06:00', status: 'SCHEDULED' },
    { _id: 'future', date: '2026-10-14', startTime: '08:00', status: 'SCHEDULED' },
    { _id: 'cancelled', date: '2026-10-15', startTime: '08:00', status: 'CANCELLED' },
  ] }, now);
  assert.equal(result.sessions.length, 1); assert.equal(result.sessions[0]._id, 'future');
});
test('coach requires a matching profile rather than receiving global totals', () => {
  assert.throws(() => dashboard().summarizeDashboard('COACH', 'missing-user', { coaches: [{ _id: 'other', userId: 'other-user' }] }, now), /hồ sơ/);
});
test('dashboard fetch keeps successful metrics when one endpoint fails', async () => {
  const empty = { list: async () => [] };
  const api = dashboard({ coachesApi: empty, classesApi: empty, schedulesApi: { list: async () => { throw new Error('offline'); } }, classRegistrationsApi: empty, activityLogsApi: empty });
  const result = await api.loadDashboard('CENTER_MANAGER', 'manager', 'token');
  assert.equal(result.errors.length, 1); assert.match(result.errors[0], /offline/);
  assert.equal(result.metrics[0].value, 0); assert.equal(result.week[0].count, null);
});

test('member navigation keeps personal home separate from staff and auth screens', () => {
  const nav = load('src/utils/member-navigation.ts');
  assert.equal(nav.isMemberPage('/member'), true); assert.equal(nav.isMemberPage('/payment-edit'), true);
  assert.equal(nav.isMemberPage('/login'), false); assert.equal(nav.isMemberPage('/manager'), false);
  assert.equal(nav.activeMemberTab('/class-detail'), '/workspace/classes');
  assert.equal(nav.activeMemberTab('/workspace/classes/edit'), '/workspace/classes');
  assert.equal(nav.activeMemberTab('/notifications'), '');
});

test('reception workspace has its own landing and operational menu', () => {
  const nav = load('src/utils/staff-navigation.ts');
  assert.equal(nav.roleHome('RECEPTIONIST'), '/reception');
  assert.equal(nav.isWorkspaceRole('RECEPTIONIST'), true);
  const menu = nav.staffMenu('RECEPTIONIST');
  assert.equal(menu.some(item => item.path === '/payments'), true);
  assert.equal(menu.some(item => item.path === '/workspace/courses'), false);
  assert.equal(menu.some(item => item.path === '/workspace/attendances'), true);
});
