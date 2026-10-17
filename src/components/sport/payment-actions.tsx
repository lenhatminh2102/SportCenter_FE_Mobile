import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { entityId, type Entity } from '@/services/operations';
import { paymentsApi, validatePaymentUrl } from '@/services/payments';
import { Button } from './ui';
import { ui } from './styles';
export function PaymentActions({ item, token, onRefresh, disabled = false, onBusyChange }: {
  item: Entity; token: string; onRefresh: () => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void;
}) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [confirm, setConfirm] = useState<'SUCCESS' | 'FAILED' | null>(null);
  function begin() {
    if (pending.current || disabled) return false;
    pending.current = true; setBusy(true); onBusyChange?.(true); setError(''); return true;
  }
  function finish() { pending.current = false; setBusy(false); onBusyChange?.(false); }
  async function prepare() {
    if (!begin()) return;
    try { const result = await paymentsApi.vnpay(token, entityId(item)); setCheckoutUrl(validatePaymentUrl(result.paymentUrl)); }
    catch (e) { setError((e as Error).message); } finally { finish(); }
  }
  async function open() {
    if (!begin()) return;
    try {
      // Open directly from this new user gesture; awaiting the API first can block web popups.
      await WebBrowser.openBrowserAsync(validatePaymentUrl(checkoutUrl));
      onRefresh();
    } catch (e) { setError((e as Error).message); } finally { finish(); }
  }
  async function simulate(status: 'SUCCESS' | 'FAILED') {
    if (!begin()) return;
    try { await paymentsApi.simulate(token, entityId(item), status); setConfirm(null); onRefresh(); }
    catch (e) { setError((e as Error).message); } finally { finish(); }
  }
  const locked = busy || disabled;
  return <View style={ui.card}>
    <Text style={ui.heading}>Tiếp tục thanh toán</Text>
    <Text style={ui.body}>BE hiện dùng VNPay sandbox để kiểm thử thanh toán.</Text>
    {item.paymentMethod === 'ONLINE' ? checkoutUrl ? <><Text style={ui.body}>Đã chuẩn bị liên kết. Bấm để mở trang VNPay trong trình duyệt.</Text><Button disabled={locked} title="Mở trang thanh toán VNPay →" onPress={() => void open()} /><Button secondary disabled={locked} title="Tạo lại liên kết" onPress={() => void prepare()} /></> : <Button disabled={locked} title={busy ? 'Đang chuẩn bị…' : 'Chuẩn bị thanh toán VNPay'} onPress={() => void prepare()} /> : <Text style={ui.body}>Liên hệ lễ tân để được hướng dẫn thanh toán tiền mặt hoặc chuyển khoản tại trung tâm.</Text>}
    <Text style={ui.body}>Sau khi quay lại, kiểm tra trạng thái mới nhất. Đóng cửa sổ VNPay không đồng nghĩa thanh toán thành công.</Text>
    <Button secondary disabled={locked} title="Kiểm tra trạng thái mới nhất" onPress={onRefresh} />
    {process.env.EXPO_PUBLIC_ENABLE_PAYMENT_DEMO === 'true' && <View style={{ gap: 12 }}><Text style={ui.eyebrow}>KIỂM THỬ · KHÔNG THU TIỀN</Text><Text style={ui.body}>Chỉ dùng với BE PAYMENT_MODE=mock. Kết quả mô phỏng có thể xác nhận đăng ký lớp.</Text>{confirm ? <><Text style={ui.body}>Xác nhận mô phỏng {confirm === 'SUCCESS' ? 'thành công và xác nhận đăng ký lớp' : 'thất bại'}?</Text><Button disabled={locked} title="Xác nhận mô phỏng" onPress={() => void simulate(confirm)} /><Button secondary disabled={locked} title="Hủy" onPress={() => setConfirm(null)} /></> : <><Button secondary disabled={locked} title="Mô phỏng thành công" onPress={() => setConfirm('SUCCESS')} /><Button secondary disabled={locked} title="Mô phỏng thất bại" onPress={() => setConfirm('FAILED')} /></>}</View>}
    {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
  </View>;
}
