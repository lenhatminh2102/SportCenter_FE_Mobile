import { useRef, useState } from 'react';
import { Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { canSendNotification, notificationsApi } from '@/services/notifications';
import { referenceId } from '@/services/operations';
import { AccessScreen } from '@/components/sport/access';
import { Screen, Button, Field } from '@/components/sport/ui';
import { RelationField } from '@/components/sport/relation-field';
import { ui } from '@/components/sport/styles';
export default function ComposeNotification() {
  const { user, token } = useAuth(); const [recipient, setRecipient] = useState(''); const [member, setMember] = useState(''); const [coach, setCoach] = useState('');
  const [title, setTitle] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const pending = useRef(false);
  if (!user || !token) return <AccessScreen />;
  if (!canSendNotification(user.role)) return <AccessScreen denied />;
  async function send() {
    if (pending.current) return;
    if (!/^[a-f\d]{24}$/i.test(recipient) || !title.trim() || !message.trim()) { setError('Chọn người nhận, nhập tiêu đề và nội dung.'); return; }
    pending.current = true; setBusy(true); setError('');
    try { await notificationsApi.create(token!, { userId: recipient, title, message }); router.dismissTo('/notifications'); }
    catch (e) { setError((e as Error).message); } finally { pending.current = false; setBusy(false); }
  }
  return <Screen><Link href="/notifications" style={ui.link}>← Thông báo</Link><Text style={ui.title}>Gửi thông báo</Text><Text style={ui.body}>Chọn hồ sơ hội viên hoặc coach để gửi thông báo trong ứng dụng. Chức năng này không gửi email hay push notification.</Text><RelationField label="Hội viên nhận tin" path="/api/members" token={token} value={member} onChange={setMember} disabled={busy} onSelect={item => { setRecipient(referenceId(item.userId)); setCoach(''); }} /><RelationField label="Coach nhận tin" path="/api/coaches" token={token} value={coach} onChange={setCoach} disabled={busy} onSelect={item => { setRecipient(referenceId(item.userId)); setMember(''); }} /><Field label="User ID người nhận" value={recipient} onChangeText={setRecipient} autoCapitalize="none" editable={!busy} /><Field label="Tiêu đề" value={title} onChangeText={setTitle} editable={!busy} /><Field label="Nội dung" multiline value={message} onChangeText={setMessage} editable={!busy} />{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button disabled={busy} title={busy ? 'Đang gửi…' : 'Gửi thông báo'} onPress={() => void send()} /></Screen>;
}
