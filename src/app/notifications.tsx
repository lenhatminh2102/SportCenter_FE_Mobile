import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useApiQuery } from '@/hooks/use-api-query';
import { notificationsApi, ownNotifications, canSendNotification } from '@/services/notifications';
import { entityId, type Entity } from '@/services/operations';
import { ListPage } from '@/components/sport/list-page';
import { AccessScreen } from '@/components/sport/access';
import { Button } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
export default function Notifications() {
  const { token, user } = useAuth();
  const [unread, setUnread] = useState(false);
  const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const pending = useRef(false);
  const userId = user?.id;
  const load = useCallback(async () => {
    if (!token || !userId) throw new Error('Phiên đăng nhập đã kết thúc.');
    return ownNotifications(await notificationsApi.list(token), userId);
  }, [token, userId]);
  const query = useApiQuery(load, !!token, false);
  const { reload } = query;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  if (!user || !token) return <AccessScreen />;
  async function toggle(item: Entity) {
    if (pending.current) return; pending.current = true; setBusy(entityId(item)); setError('');
    try { await notificationsApi.setRead(token!, entityId(item), !item.isRead); query.reload(); }
    catch (e) { setError((e as Error).message); } finally { pending.current = false; setBusy(''); }
  }
  const count = query.data?.filter(item => !item.isRead).length;
  return <ListPage title="Thông báo của tôi" description={count === undefined ? 'Cập nhật từ trung tâm và huấn luyện viên.' : `${count} thông báo chưa đọc`} items={(query.data || []).filter(item => !unread || !item.isRead)} loading={query.loading} error={query.error} reload={query.reload} controls={<View style={{ gap: 12 }}><Button secondary title={unread ? 'Hiện tất cả' : 'Chỉ hiện chưa đọc'} onPress={() => setUnread(v => !v)} />{canSendNotification(user.role) && <Button title="+ Gửi thông báo" onPress={() => router.push('/notification-compose')} />}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}</View>} renderItem={item => <View style={[ui.card, !item.isRead && { borderColor: '#f05a28' }]}><Text style={ui.eyebrow}>{item.isRead ? 'ĐÃ ĐỌC' : '● CHƯA ĐỌC'}</Text><Text style={ui.heading}>{String(item.title || '')}</Text><Text style={ui.body}>{String(item.message || '')}</Text><Text style={ui.body}>{item.createdAt ? new Date(String(item.createdAt)).toLocaleString('vi-VN') : ''}</Text><Button secondary disabled={!!busy} title={busy === entityId(item) ? 'Đang cập nhật…' : item.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'} onPress={() => void toggle(item)} /></View>} />;
}
