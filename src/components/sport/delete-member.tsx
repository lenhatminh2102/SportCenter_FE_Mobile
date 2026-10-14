import { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Button } from './ui';
import { ui } from './styles';
import { membersApi, memberId, type MemberProfile } from '@/services/members';
export function DeleteMember({ member, token, onDeleted }: { member: MemberProfile; token: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  async function remove() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { await membersApi.remove(token, memberId(member)); setOpen(false); onDeleted(); }
    catch (e) { setError((e as Error).message); }
    finally { pending.current = false; setBusy(false); }
  }
  return <><Button secondary title="Xóa hồ sơ" onPress={() => { setError(''); setOpen(true); }} /><Modal visible={open} transparent animationType="fade" onRequestClose={() => { if (!busy) setOpen(false); }}><View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 }}><View accessibilityViewIsModal style={[ui.card, { width: '100%', maxWidth: 480, alignSelf: 'center' }]}><Text style={ui.heading}>Xóa hồ sơ {member.fullName}?</Text><Text style={ui.body}>Thao tác xóa hồ sơ hội viên không thể hoàn tác. Tài khoản đăng nhập vẫn còn trên hệ thống.</Text>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button title={busy ? 'Đang xóa…' : 'Xác nhận xóa hồ sơ'} disabled={busy} onPress={remove} /><Button secondary title="Hủy" disabled={busy} onPress={() => setOpen(false)} /></View></View></Modal></>;
}
