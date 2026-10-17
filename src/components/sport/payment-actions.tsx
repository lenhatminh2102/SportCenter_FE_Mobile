import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { entityId, type Entity } from '@/services/operations';
import { paymentsApi, validatePaymentUrl } from '@/services/payments';
import { Button } from './ui';
import { ui } from './styles';
export function PaymentActions({ item, token, onRefresh }: { item: Entity; token: string; onRefresh: () => void }) {
  const pending = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [confirm, setConfirm] = useState<'SUCCESS' | 'FAILED' | null>(null);
  async function act(result?: 'SUCCESS' | 'FAILED') {
    if (pending.current) return; pending.current = true; setBusy(true); setError('');
    try {
      if (result) { await paymentsApi.simulate(token, entityId(item), result); setConfirm(null); onRefresh(); }
      else { const { paymentUrl } = await paymentsApi.vnpay(token, entityId(item)); await WebBrowser.openBrowserAsync(validatePaymentUrl(paymentUrl)); onRefresh(); }
    } catch (e) { setError((e as Error).message); } finally { pending.current = false; setBusy(false); }
  }
  return <View style={ui.card}><Text style={ui.heading}>Tiếp tục thanh toán</Text>{item.paymentMethod === 'ONLINE' ? <Button disabled={busy} title={busy ? 'Đang xử lý…' : 'Mở VNPay'} onPress={() => void act()} /> : <Text style={ui.body}>Liên hệ lễ tân để được hướng dẫn thanh toán tại trung tâm. Không tự chuyển tiền khi chưa xác nhận đúng thông tin người nhận.</Text>}<Text style={ui.body}>Sau khi quay lại ứng dụng, làm mới để lấy trạng thái BE. Đóng cửa sổ VNPay không đồng nghĩa thanh toán thành công.</Text><Button secondary disabled={busy} title="Kiểm tra trạng thái mới nhất" onPress={onRefresh} />{process.env.EXPO_PUBLIC_ENABLE_PAYMENT_DEMO === 'true' && <View style={{ gap: 12 }}><Text style={ui.eyebrow}>KIỂM THỬ · KHÔNG THU TIỀN</Text><Text style={ui.body}>Chỉ dùng với BE PAYMENT_MODE=mock. Kết quả mô phỏng có thể thay đổi trạng thái đăng ký lớp.</Text>{confirm ? <><Text style={ui.body}>Xác nhận mô phỏng {confirm === 'SUCCESS' ? 'thành công và xác nhận đăng ký lớp' : 'thất bại'}?</Text><Button disabled={busy} title="Xác nhận mô phỏng" onPress={() => void act(confirm)} /><Button secondary disabled={busy} title="Hủy" onPress={() => setConfirm(null)} /></> : <><Button secondary disabled={busy} title="Mô phỏng thành công" onPress={() => setConfirm('SUCCESS')} /><Button secondary disabled={busy} title="Mô phỏng thất bại" onPress={() => setConfirm('FAILED')} /></>}</View>}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}</View>;
}
