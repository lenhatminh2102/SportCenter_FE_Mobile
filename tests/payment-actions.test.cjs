const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function harness(disabled = false) {
  let cursor = 0; const slots = []; const calls = { prepare: 0, open: 0, refreshed: 0 };
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    react: {
      useRef: value => { const index = cursor++; return slots[index] ||= { current: value }; },
      useState: value => { const index = cursor++; if (!(index in slots)) slots[index] = value; return [slots[index], next => { slots[index] = next; }]; },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { Text: 'Text', View: 'View' },
    'expo-web-browser': { openBrowserAsync: async url => { assert.equal(url, 'https://sandbox.vnpayment.vn/payment'); calls.open++; } },
    '@/services/operations': { entityId: item => item.id },
    '@/services/payments': {
      validatePaymentUrl: value => value,
      paymentsApi: { vnpay: async () => { calls.prepare++; return { paymentUrl: 'https://sandbox.vnpayment.vn/payment' }; } },
    },
    './ui': { Button: 'Button' }, './styles': { ui: {} },
  };
  const context = { exports: {}, require: name => dependencies[name], process: { env: {} } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/sport/payment-actions.tsx', 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText, context);
  function render() { cursor = 0; return context.exports.PaymentActions({ item: { id: 'p', paymentMethod: 'ONLINE' }, token: 'token', disabled, onRefresh: () => calls.refreshed++ }); }
  function button(tree, title) {
    if (!tree || typeof tree !== 'object') return undefined;
    if (tree.type === 'Button' && tree.props.title === title) return tree;
    return [].concat(tree.props?.children || []).flat(Infinity).map(child => button(child, title)).find(Boolean);
  }
  return { render, button, calls };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test('checkout is prepared first and browser opens only on a fresh user click', async () => {
  const h = harness();
  h.button(h.render(), 'Chuẩn bị thanh toán VNPay').props.onPress();
  await settle(); assert.equal(h.calls.prepare, 1); assert.equal(h.calls.open, 0);
  h.button(h.render(), 'Mở trang thanh toán VNPay →').props.onPress();
  assert.equal(h.calls.open, 1); // synchronous user gesture, before any awaited API request
  await settle(); assert.equal(h.calls.refreshed, 1);
});
test('unsaved method or another pending action disables checkout requests', async () => {
  const h = harness(true); const button = h.button(h.render(), 'Chuẩn bị thanh toán VNPay');
  assert.equal(button.props.disabled, true); button.props.onPress(); await settle();
  assert.equal(h.calls.prepare, 0); assert.equal(h.calls.open, 0);
});
