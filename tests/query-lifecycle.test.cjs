const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function hookHarness() {
  const slots = []; let cursor = 0; let writes = 0;
  class ApiError extends Error {}
  const context = { exports: {}, Error, require: name => name === 'react' ? {
    useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; writes++; }]; },
    useCallback: fn => { cursor++; return fn; },
    useEffect: (effect, deps) => { const index = cursor++; const old = slots[index]; if (!old || deps.some((dep, i) => dep !== old.deps[i])) { old?.cleanup?.(); slots[index] = { deps, cleanup: effect() }; } },
  } : { ApiError } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/hooks/use-api-query.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  return { render(loader, enabled = true) { cursor = 0; return context.exports.useApiQuery(loader, enabled); }, get writes() { return writes; } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test('query captures synchronous loader errors instead of crashing the logout transition', async () => {
  const h = hookHarness(); const loader = () => { throw new Error('Session ended'); };
  assert.doesNotThrow(() => h.render(loader)); await settle();
  assert.equal(h.render(loader).error.message, 'Session ended');
});
test('logout before the queued request starts prevents loader execution', async () => {
  const h = hookHarness(); let calls = 0; const loader = async () => { calls++; return 'private'; };
  h.render(loader); h.render(loader, false); await settle();
  assert.equal(calls, 0); assert.equal(h.render(loader, false).data, null);
});
test('late request after logout cannot restore old account data', async () => {
  const h = hookHarness(); let resolve;
  const loader = () => new Promise(done => { resolve = done; });
  h.render(loader); await settle(); h.render(loader, false); const before = h.writes;
  resolve('private'); await settle(); assert.equal(h.writes, before); assert.equal(h.render(loader, false).data, null);
});
test('disabled query remains inactive when focus requests a refresh', async () => {
  const h = hookHarness(); let calls = 0; const loader = async () => { calls++; return []; };
  h.render(loader, false).reload(); h.render(loader, false); await settle(); assert.equal(calls, 0);
});

test('logged-out coach and manager dashboards never read a null user or request private data', async () => {
  for (const role of ['COACH', 'CENTER_MANAGER']) {
    let captured; let requests = 0;
    const jsx = (type, props) => ({ type, props });
    const deps = {
      react: { useCallback: fn => fn }, 'react/jsx-runtime': { jsx, jsxs: jsx },
      'react-native': { useWindowDimensions: () => ({ width: 1200 }) },
      'expo-router': { useFocusEffect: () => {} },
      '@/context/auth': { useAuth: () => ({ user: null, token: null }) },
      '@/context/staff-shell': { useStaffShell: () => false },
      '@/services/dashboard': { loadDashboard: async () => { requests++; } },
      '@/hooks/use-api-query': { useApiQuery: (loader, enabled) => { captured = { loader, enabled }; return { reload: () => {} }; } },
      '@/components/sport/access': { AccessScreen: 'AccessScreen' },
    };
    const context = { exports: {}, Error, require: name => deps[name] || {} };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/dashboard/dashboard.tsx', 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText, context);
    assert.doesNotThrow(() => context.exports.Dashboard({ role }));
    assert.equal(captured.enabled, false);
    await assert.rejects(captured.loader(), /Phiên đăng nhập đã kết thúc/);
    assert.equal(requests, 0);
  }
});


test('every coach attendance form entry uses schedule attendance and preserves selected session', () => {
  const jsx = (type, props) => ({ type, props });
  const CoachAttendanceForm = () => {};
  const context = { exports: {}, require: name => name === 'react/jsx-runtime' ? { jsx, jsxs: jsx } : name === './coach-attendance-form' ? { CoachAttendanceForm } : {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/sport/resource-form.tsx', 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText, context);
  const props = { resource: 'attendances', role: 'COACH', token: 'token', initial: { _id: 'attendance' }, defaults: { classId: 'class', date: '2026-10-24', scheduleId: 'session' }, onSaved() {} };
  const result = context.exports.ResourceForm(props);
  assert.equal(result.type, CoachAttendanceForm);
  for (const key of ['token', 'initial', 'defaults', 'onSaved']) assert.equal(result.props[key], props[key]);
  assert.notEqual(context.exports.ResourceForm({ ...props, role: 'CENTER_MANAGER' }).type, CoachAttendanceForm);
  assert.notEqual(context.exports.ResourceForm({ ...props, resource: 'lesson-progress' }).type, CoachAttendanceForm);
});
