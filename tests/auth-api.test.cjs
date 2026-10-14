const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/services/api.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function client(fetch) {
  const context = { exports: {}, require: () => ({ Platform: { OS: 'web' } }), process: { env: {} }, fetch, AbortController, setTimeout, clearTimeout, TypeError };
  vm.runInNewContext(source, context);
  return context.exports;
}
test('registration sends MEMBER and normalized email, excluding profile fields', async () => {
  const api = client(async (url, options) => {
    assert.equal(url, 'http://localhost:5000/api/auth/register');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { email: 'test@example.com', password: 'secret1', role: 'MEMBER' });
    return { ok: true, json: async () => ({ success: true, data: { id: '1' } }) };
  });
  assert.equal((await api.authApi.register(' Test@Example.com ', 'secret1')).id, '1');
});
test('login reads token and me attaches Bearer authorization', async () => {
  const api = client(async (url, options) => {
    if (url.endsWith('/login')) return { ok: true, json: async () => ({ success: true, data: { token: 'test-token' } }) };
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.equal(options.method, 'GET');
    return { ok: true, json: async () => ({ success: true, data: { email: 'test@example.com' } }) };
  });
  const session = await api.authApi.login('test@example.com', 'secret1');
  assert.equal((await api.authApi.me(session.token)).email, 'test@example.com');
});
test('server errors and malformed responses are rejected', async () => {
  const api = client(async () => ({ ok: false, status: 401, json: async () => ({ success: false, message: 'Invalid email or password' }) }));
  await assert.rejects(api.authApi.login('bad@example.com', 'wrong'), /Invalid email or password/);
  const malformed = client(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError(); } }));
  await assert.rejects(malformed.authApi.login('a@b.com', 'wrong'), /HTTP 200/);
});
test('network failures have actionable messages', async () => {
  const api = client(async () => { throw new TypeError('fetch failed'); });
  await assert.rejects(api.authApi.login('a@b.com', 'wrong'), /Không kết nối được backend/);
});
function membersClient(fetch) {
  const api = client(fetch);
  const context = { exports: {}, require: () => api };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/members.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  return { ...context.exports, api };
}
const profile = { fullName: ' Test Member ', phone: '090 123 4567', goal: ' Fitness ', level: 'BEGINNER' };
for (const [name, method, path, args] of [
  ['me', 'GET', '/api/members/me', []],
  ['createMe', 'POST', '/api/members/me', [profile]],
  ['updateMe', 'PUT', '/api/members/me', [profile]],
  ['list', 'GET', '/api/members', []],
  ['create', 'POST', '/api/members', ['507f1f77bcf86cd799439011', profile]],
  ['update', 'PUT', '/api/members/member-id', ['member-id', profile]],
  ['remove', 'DELETE', '/api/members/member-id', ['member-id']],
]) {
  test(`Members ${name} sends correct method, path and bearer token`, async () => {
    const { membersApi } = membersClient(async (url, options) => {
      assert.equal(url, `http://localhost:5000${path}`);
      assert.equal(options.method, method);
      assert.equal(options.headers.Authorization, 'Bearer session-token');
      if (method === 'POST' || method === 'PUT') {
        const body = JSON.parse(options.body);
        assert.equal(body.fullName, 'Test Member'); assert.equal(body.phone, '0901234567');
        assert.equal(body.goal, 'Fitness'); assert.equal(body.level, 'BEGINNER');
        assert.equal(body.userId, name === 'create' ? '507f1f77bcf86cd799439011' : undefined);
      } else assert.equal(options.body, undefined);
      return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) };
    });
    await membersApi[name]('session-token', ...args);
  });
}
test('Google exchanges an ID token rather than an access token', async () => {
  const api = client(async (url, options) => {
    assert.equal(url, 'http://localhost:5000/api/auth/google');
    assert.deepEqual(JSON.parse(options.body), { idToken: 'google-id-token' });
    return { ok: true, status: 200, json: async () => ({ success: true, data: { token: 'session-token' } }) };
  });
  assert.equal((await api.authApi.google('google-id-token')).token, 'session-token');
});
test('missing profile is distinguishable from network and permission errors', async () => {
  const { membersApi, api } = membersClient(async () => ({ ok: false, status: 404, json: async () => ({ success: false, message: 'Member profile not found' }) }));
  await assert.rejects(membersApi.me('token'), error => error instanceof api.ApiError && error.status === 404);
});
test('only a protected 401 invalidates its own session', async () => {
  const api = client(async () => ({ ok: false, status: 401, json: async () => ({ success: false, message: 'Expired token' }) }));
  const invalidated = []; const unsubscribe = api.onUnauthorized(token => invalidated.push(token));
  await assert.rejects(api.authApi.login('bad@example.com', 'wrong'));
  assert.deepEqual(invalidated, []);
  await assert.rejects(api.authApi.me('expired-token'));
  assert.deepEqual(invalidated, ['expired-token']);
  unsubscribe();
  await assert.rejects(api.authApi.me('another-token'));
  assert.equal(invalidated.length, 1);
});
test('successful empty delete response is accepted', async () => {
  const { membersApi } = membersClient(async () => ({ ok: true, status: 204 }));
  assert.equal(await membersApi.remove('token', 'member-id'), undefined);
});
test('manager and receptionist permissions differ for deletion', () => {
  const context = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/permissions.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  const { canManageMembers, canDeleteMembers } = context.exports;
  assert.equal(canManageMembers('MEMBER'), false);
  assert.equal(canManageMembers('RECEPTIONIST'), true);
  assert.equal(canDeleteMembers('RECEPTIONIST'), false);
  assert.equal(canDeleteMembers('CENTER_MANAGER'), true);
});
