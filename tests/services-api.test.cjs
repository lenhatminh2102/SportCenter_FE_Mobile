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
    const context = { exports: {}, fetch, URL, AbortController, setTimeout, clearTimeout, TypeError, process: { env: {} }, require: dep => dep === 'react-native' ? { Platform: { OS: 'web' } } : load(path.posix.normalize(path.posix.join(path.posix.dirname(file), dep + '.ts'))) };
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
