const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function loadService(name, fetch = async () => ({ ok: true, status: 200, json: async () => ({ success: true, data: [] }) })) {
  const cache = {};
  function load(file) {
    if (cache[file]) return cache[file];
    const context = { exports: {}, fetch, URL, AbortController, setTimeout, clearTimeout, TypeError, process: { env: {} }, require: dep => dep === 'react-native' ? { Platform: { OS: 'web' } } : load(dep.startsWith('@/') ? 'src/' + dep.slice(2) + '.ts' : path.posix.normalize(path.posix.join(path.posix.dirname(file), dep + '.ts'))) };
    cache[file] = context.exports;
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
    return context.exports;
  }
  return load(`src/services/${name}.ts`);
}
const cases = [
  ['notifications', 'notificationsApi', 'list', [], '/notifications', 'GET', undefined],
  ['notifications', 'notificationsApi', 'create', [{ userId: 'u', title: ' News ', message: ' Hello ' }], '/notifications', 'POST', { userId: 'u', title: 'News', message: 'Hello' }],
  ['notifications', 'notificationsApi', 'setRead', ['a/b', false], '/notifications/a%2Fb', 'PUT', { isRead: false }],
  ['support', 'supportApi', 'list', [], '/support-requests', 'GET', undefined],
  ['support', 'supportApi', 'create', ['m', ' Help '], '/support-requests', 'POST', { memberId: 'm', message: 'Help' }],
  ['support', 'supportApi', 'update', ['a/b', 'RESOLVED'], '/support-requests/a%2Fb', 'PUT', { status: 'RESOLVED' }],
  ['payments', 'paymentsApi', 'list', [], '/payments', 'GET', undefined],
  ['payments', 'paymentsApi', 'create', ['r', 'ONLINE'], '/payments', 'POST', { classRegistrationId: 'r', paymentMethod: 'ONLINE' }],
  ['payments', 'paymentsApi', 'update', ['a/b', 'CASH'], '/payments/a%2Fb', 'PUT', { paymentMethod: 'CASH' }],
  ['payments', 'paymentsApi', 'vnpay', ['p'], '/payments/p/vnpay', 'POST', {}],
  ['payments', 'paymentsApi', 'simulate', ['p', 'FAILED'], '/payments/p/simulate', 'POST', { status: 'FAILED' }],
  ['operations', 'coachesApi', 'me', [], '/coaches/me', 'GET', undefined],
  ['operations', 'coachesApi', 'myStudents', [], '/coaches/my-students', 'GET', undefined],
  ['operations', 'schedulesApi', 'coachMy', [], '/schedules/coach/my', 'GET', undefined],
  ['rooms', 'roomsApi', 'get', ['a/b'], '/rooms/a%2Fb', 'GET', undefined],
];
for (const [service, api, method, args, suffix, verb, body] of cases) test(`${service}.${method} sends correct auth and payload`, async () => {
  const module = loadService(service, async (url, options) => {
    assert.equal(url, `http://localhost:5000/api${suffix}`); assert.equal(options.method, verb); assert.equal(options.headers.Authorization, 'Bearer token');
    assert.deepEqual(options.body ? JSON.parse(options.body) : undefined, body);
    return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) };
  });
  await module[api][method]('token', ...args);
});
test('notification and support ownership exclude foreign or missing references', () => {
  const n = loadService('notifications'); const s = loadService('support');
  assert.equal(n.ownNotifications([{ userId: { _id: 'u' } }, { userId: 'other' }, {}], 'u').length, 1);
  assert.equal(s.ownSupport([{ memberId: 'm' }, { memberId: { id: 'other' } }, {}], 'm').length, 1);
  assert.equal(n.ownNotifications([{}], '').length, 0); assert.equal(s.ownSupport([{}], '').length, 0);
  assert.equal(n.canSendNotification('MEMBER'), false); assert.equal(n.canSendNotification('COACH'), true);
  assert.equal(s.canResolveSupport('COACH'), false); assert.equal(s.canResolveSupport('RECEPTIONIST'), true);
});
test('payment ownership resolves populated and unpopulated registrations', () => {
  const p = loadService('payments');
  const items = [{ classRegistrationId: 'r' }, { classRegistrationId: { _id: 's', memberId: { _id: 'm' } } }, { classRegistrationId: 'other' }, {}];
  assert.equal(p.ownPayments(items, [{ _id: 'r', memberId: 'm' }], 'm').length, 2);
  assert.equal(p.ownPayments(items, [], '').length, 0);
  assert.equal(p.canManagePayments('COACH'), false);
});
test('checkout accepts only supported HTTPS VNPay hosts', () => {
  const { validatePaymentUrl } = loadService('payments');
  assert.ok(validatePaymentUrl('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?a=1'));
  for (const url of ['http://sandbox.vnpayment.vn', 'https://sandbox.vnpayment.vn.evil.com', 'javascript:alert(1)', 'https://user:pass@pay.vnpay.vn', 'https://example.com']) assert.throws(() => validatePaymentUrl(url));
});
test('server payment rejection does not become client success', async () => {
  const p = loadService('payments', async () => ({ ok: false, status: 403, json: async () => ({ success: false, message: 'Mock payment is disabled' }) }));
  await assert.rejects(p.paymentsApi.simulate('token', 'p', 'SUCCESS'), /Mock payment is disabled/);
});

test('payment shortcut reuses pending requests and excludes already charged registrations', () => {
  const p = loadService('payments');
  const payments = [{ _id: 'p', classRegistrationId: { _id: 'r' }, status: 'PENDING' }, { _id: 'old', classRegistrationId: 'retry', status: 'FAILED' }, { _id: 'paid', classRegistrationId: 'paid-r', status: 'SUCCESS' }];
  assert.equal(p.pendingPaymentForRegistration(payments, 'r')._id, 'p');
  assert.equal(p.pendingPaymentForRegistration(payments, 'retry'), undefined);
  assert.equal(p.pendingPaymentForRegistration(payments, undefined), undefined);
  const eligible = p.payableRegistrations([{ _id: 'r', status: 'PENDING_PAYMENT' }, { _id: 'retry', status: 'PENDING_PAYMENT' }, { _id: 'cancelled', status: 'CANCELLED' }, { _id: 'paid-r', status: 'PENDING_PAYMENT' }], payments);
  assert.deepEqual(Array.from(eligible, item => item._id), ['retry']);
});
test('member homepage scopes account data and tolerates one unavailable dataset', async () => {
  const responses = {
    '/api/members/me': { _id: 'm', fullName: 'Test Member' },
    '/api/classes': [{ _id: 'c', name: 'Yoga' }],
    '/api/notifications': [{ userId: 'u', isRead: false }, { userId: 'other', isRead: false }],
    '/api/class-registrations': [{ _id: 'r', memberId: 'm', status: 'PENDING_PAYMENT' }, { _id: 'foreign', memberId: 'other', status: 'CONFIRMED' }],
    '/api/payments': [{ classRegistrationId: 'r', status: 'PENDING' }, { classRegistrationId: 'foreign', status: 'PENDING' }],
  };
  const home = loadService('member-home', async url => {
    const path = new URL(url).pathname;
    if (path === '/api/schedules/my') return { ok: false, status: 500, json: async () => ({ success: false, message: 'Schedule unavailable' }) };
    return { ok: true, status: 200, json: async () => ({ success: true, data: responses[path] }) };
  });
  const data = await home.loadMemberHome('token', 'u');
  assert.equal(data.unread, 1); assert.equal(data.registrations.length, 1); assert.equal(data.payments.length, 1);
  assert.equal(data.schedules, null); assert.equal(data.classes.length, 1); assert.equal(data.errors.length, 1);
});
test('new member without profile can browse classes without loading personal billing', async () => {
  const calls = [];
  const home = loadService('member-home', async url => {
    const path = new URL(url).pathname; calls.push(path);
    if (path === '/api/members/me') return { ok: false, status: 404, json: async () => ({ success: false, message: 'No profile' }) };
    return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) };
  });
  const data = await home.loadMemberHome('token', 'u');
  assert.equal(data.profileMissing, true); assert.equal(data.errors.length, 0); assert.equal(data.classes.length, 0);
  assert.equal(data.payments, null); assert.equal(calls.includes('/api/payments'), false);
});
test('member upcoming sessions exclude past and cancelled appointments in Bangkok time', () => {
  const { upcomingMemberSessions } = loadService('member-home');
  const items = [{ _id: 'past', date: '2026-10-17', startTime: '08:00', status: 'SCHEDULED' }, { _id: 'next', date: '2026-10-17', startTime: '10:00', status: 'SCHEDULED' }, { _id: 'cancel', date: '2026-10-18', startTime: '10:00', status: 'CANCELLED' }];
  assert.deepEqual(Array.from(upcomingMemberSessions(items, new Date('2026-10-17T02:00:00Z')), item => item._id), ['next']);
});

test('role workflows keep reception operations separate from coach teaching and manager setup', () => {
  const scope = loadService('../utils/role-workflows');
  assert.equal(scope.canReadResource('activity-logs', 'MEMBER'), false);
  assert.equal(scope.canReadResource('workout-plans', 'RECEPTIONIST'), false);
  assert.equal(scope.canReadResource('attendances', 'RECEPTIONIST'), true);
  assert.equal(scope.canReadResource('classes', 'COACH'), true);
  const records = [{ classId: 'own', memberId: 'm' }, { classId: 'other', memberId: 'other-m' }];
  assert.equal(scope.scopeCoachRecords('attendances', records, [{ _id: 'own' }], []).length, 1);
  assert.equal(scope.scopeCoachRecords('lesson-progress', records, [], [{ member: { _id: 'm' } }]).length, 1);
  assert.throws(() => scope.assertCoachAssignment({ classId: 'other', memberId: 'm' }, 'coach', [{ _id: 'own', coachId: 'coach' }], [{ member: 'm', class: 'own' }]));
  assert.throws(() => scope.assertCoachAssignment({ classId: 'own', memberId: 'foreign' }, 'coach', [{ _id: 'own', coachId: 'coach' }], [{ member: 'm', class: 'own' }]));
});
test('enrollment saves only after matching schedule confirmation and uses the correct member', async () => {
  let posted;
  const schedule = { _id: 's', classId: 'c', date: '2099-10-17', startTime: '08:00', endTime: '09:00', roomId: 'room', status: 'SCHEDULED' };
  const service = loadService('enrollment', async (url, options) => {
    const path = new URL(url).pathname;
    if (options.method === 'POST') { posted = JSON.parse(options.body); return { ok: true, status: 201, json: async () => ({ success: true, data: { _id: 'r', ...posted, status: 'PENDING_PAYMENT' } }) }; }
    const data = { '/api/class-registrations': [], '/api/classes': [{ _id: 'c', courseId: 'course' }], '/api/courses': [{ _id: 'course', price: 500000, status: 'ACTIVE' }], '/api/schedules': [schedule] }[path];
    return { ok: true, status: 200, json: async () => ({ success: true, data }) };
  });
  const result = await service.saveEnrollment('token', { classId: 'c', memberId: 'm', confirmedSchedule: 's|2099-10-17|08:00|09:00|room' });
  assert.deepEqual(posted, { classId: 'c', memberId: 'm' }); assert.equal(result.status, 'PENDING_PAYMENT');
});
test('changed or missing schedules block registration instead of submitting stale choices', async () => {
  let writes = 0;
  const service = loadService('enrollment', async (url, options) => {
    if (options.method === 'POST') writes++;
    const data = { '/api/class-registrations': [], '/api/classes': [{ _id: 'c', courseId: 'course' }], '/api/courses': [{ _id: 'course', price: 500000, status: 'ACTIVE' }], '/api/schedules': [] }[new URL(url).pathname];
    return { ok: true, status: 200, json: async () => ({ success: true, data }) };
  });
  await assert.rejects(service.saveEnrollment('token', { classId: 'c', memberId: 'm', confirmedSchedule: 'old' }), error => error instanceof service.ScheduleChangedError);
  assert.equal(writes, 0);
});
test('existing pending registration resumes but confirmed/cancelled registrations are never recreated', async () => {
  for (const status of ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED']) {
    let writes = 0;
    const service = loadService('enrollment', async (url, options) => {
      if (options.method === 'POST') writes++;
      return { ok: true, status: 200, json: async () => ({ success: true, data: [{ _id: 'r', classId: 'c', memberId: 'm', status }] }) };
    });
    const result = service.saveEnrollment('token', { classId: 'c', memberId: 'm', confirmedSchedule: 'unused' });
    if (status === 'PENDING_PAYMENT') assert.equal((await result)._id, 'r'); else await assert.rejects(result);
    assert.equal(writes, 0);
  }
});

test('enrollment detects overlapping confirmed classes but allows adjacent sessions', () => {
  const flow = loadService('../utils/enrollment');
  const sessions = [{ _id: 'selected', classId: 'new', date: '2099-10-17', startTime: '08:00', endTime: '09:00', status: 'SCHEDULED' }, { _id: 'booked', classId: 'old', date: '2099-10-17', startTime: '08:30', endTime: '09:30', status: 'SCHEDULED' }];
  const registrations = [{ memberId: 'm', classId: 'old', status: 'CONFIRMED' }];
  assert.equal(flow.enrollmentConflicts(sessions, registrations, 'new', 'm').length, 1);
  sessions[1].startTime = '09:00';
  assert.equal(flow.enrollmentConflicts(sessions, registrations, 'new', 'm').length, 0);
  sessions[1].startTime = '08:30'; registrations[0].status = 'PENDING_PAYMENT';
  assert.equal(flow.enrollmentConflicts(sessions, registrations, 'new', 'm').length, 0);
});

test('coach roster shows pending and confirmed names only for assigned classes', () => {
  const { buildCoachRoster, coachStudentName } = loadService('../utils/coach-roster');
  const classes = [{ _id: 'own', name: 'Yoga', coachId: 'coach' }, { _id: 'foreign', name: 'Boxing', coachId: 'other' }];
  const rows = buildCoachRoster([
    { _id: 'new', classId: 'own', memberId: { _id: 'm1', fullName: 'Nguyễn An', phone: '0901234567' }, status: 'PENDING_PAYMENT', registeredAt: '2026-10-17' },
    { _id: 'paid', classId: { _id: 'own' }, memberId: { _id: 'm2', fullName: 'Trần Bình' }, status: 'CONFIRMED', registeredAt: '2026-10-16' },
    { _id: 'hidden', classId: 'foreign', memberId: { _id: 'm3', fullName: 'Foreign' }, status: 'PENDING_PAYMENT' },
    { _id: 'cancelled', classId: 'own', memberId: { _id: 'm4', fullName: 'Cancelled' }, status: 'CANCELLED' },
  ], classes, 'coach');
  assert.equal(rows.length, 2); assert.equal(coachStudentName(rows[0]), 'Nguyễn An');
  assert.equal(rows[0].status, 'PENDING_PAYMENT'); assert.equal(coachStudentName(rows[1]), 'Trần Bình');
  assert.equal(buildCoachRoster([], classes, '').length, 0);
});
test('coach roster counts repeat students by member and avoids exposing raw IDs as names', () => {
  const { buildCoachRoster, coachStudentName } = loadService('../utils/coach-roster');
  const rows = buildCoachRoster([{ _id: 'a', classId: 'a', memberId: 'm', status: 'PENDING_PAYMENT' }, { _id: 'b', classId: 'b', memberId: { _id: 'm', fullName: 'Member' }, status: 'CONFIRMED' }], [{ _id: 'a', coachId: 'c' }, { _id: 'b', coachId: 'c' }], 'c');
  assert.equal(rows.length, 2); assert.equal(new Set(rows.map(item => item.memberId)).size, 1);
  assert.equal(coachStudentName(rows[0]), 'Chưa tải được tên hội viên');
});
