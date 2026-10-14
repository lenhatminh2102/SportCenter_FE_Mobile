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
