import { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { classRegistrationsApi, entityId, referenceId, type Entity } from '@/services/operations';
import { Button } from './ui';
import { ui } from './styles';
export function CancelRegistration({ item, token, onCancelled }: { item: Entity; token: string; onCancelled: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  async function cancel() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      await classRegistrationsApi.update(token, entityId(item), { classId: referenceId(item.classId), memberId: referenceId(item.memberId), status: 'CANCELLED' });
      setOpen(false); onCancelled();
    } catch (e) { setError((e as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <><Button secondary title="Hủy đăng ký lớp" onPress={() => setOpen(true)} /><Modal visible={open} transparent animationType="fade" onRequestClose={() => { if (!busy) setOpen(false); }}><View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#0008' }}><View accessibilityViewIsModal style={[ui.card, { maxWidth: 480, width: '100%', alignSelf: 'center' }]}><Text style={ui.heading}>Hủy đăng ký lớp này?</Text><Text style={ui.body}>Đăng ký chuyển sang trạng thái đã hủy. Thao tác này không tự hoàn tiền.</Text>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button title={busy ? 'Đang xử lý…' : 'Xác nhận hủy'} disabled={busy} onPress={cancel} /><Button secondary title="Giữ đăng ký" disabled={busy} onPress={() => setOpen(false)} /></View></View></Modal></>;
}
