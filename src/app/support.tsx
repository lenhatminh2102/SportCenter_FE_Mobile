import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useActorProfile } from '@/hooks/use-actor-profile';
import { useApiQuery } from '@/hooks/use-api-query';
import { supportApi, canResolveSupport, ownSupport } from '@/services/support';
import { entityId, referenceLabel, type Entity } from '@/services/operations';
import { AccessScreen, QueryStatus } from '@/components/sport/access';
import { ListPage } from '@/components/sport/list-page';
import { Button, Field } from '@/components/sport/ui';
import { ui } from '@/components/sport/styles';
export default function Support() {
  const { user, token } = useAuth(); const member = user?.role === 'MEMBER'; const staff = canResolveSupport(user?.role);
  const actor = useActorProfile(member); const actorId = actor.data ? entityId(actor.data) : '';
  const [message, setMessage] = useState(''); const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const pending = useRef(false);
  const load = useCallback(async () => { const items = await supportApi.list(token!); return member ? ownSupport(items, actorId) : items; }, [token, member, actorId]);
  const query = useApiQuery(load, !!token && (staff || member && !!actorId), false);
  const { reload } = query;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  if (!user || !token) return <AccessScreen />;
  if (!member && !staff) return <AccessScreen denied />;
  async function save(item?: Entity) {
    if (pending.current) return;
    if (!item && !message.trim()) { setError('Nhập nội dung cần hỗ trợ.'); return; }
    pending.current = true; setBusy(true); setError('');
    try { if (item) await supportApi.update(token!, entityId(item), item.status === 'RESOLVED' ? 'PENDING' : 'RESOLVED'); else { await supportApi.create(token!, actorId, message); setMessage(''); } query.reload(); }
    catch (e) { setError((e as Error).message); } finally { pending.current = false; setBusy(false); }
  }
  return <ListPage title={member ? 'Trung tâm hỗ trợ' : 'Yêu cầu từ hội viên'} description="Theo dõi yêu cầu đổi lịch, thông tin lớp học và các vấn đề cần trung tâm hỗ trợ." items={(query.data || []).filter(item => filter === 'ALL' || item.status === filter)} loading={query.loading || member && actor.loading} error={query.error} reload={query.reload} controls={<View style={{ gap: 12 }}>{member && <><QueryStatus loading={actor.loading} error={actor.error} retry={actor.reload} />{actor.error ? <Link href="/profile" style={ui.link}>Hoàn thiện hồ sơ hội viên →</Link> : <View style={ui.card}><Text style={ui.heading}>Bạn cần hỗ trợ gì?</Text><Field label="Nội dung yêu cầu" multiline value={message} onChangeText={setMessage} editable={!busy} /><Button title={busy ? 'Đang gửi…' : 'Gửi yêu cầu'} disabled={busy || !actorId} onPress={() => void save()} /></View>}</>}<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['ALL', 'PENDING', 'RESOLVED'] as const).map(value => <Button key={value} secondary={value !== filter} title={value === 'ALL' ? 'Tất cả' : value === 'PENDING' ? 'Chờ xử lý' : 'Đã giải quyết'} onPress={() => setFilter(value)} />)}</View>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}</View>} renderItem={item => <View style={ui.card}><Text style={ui.eyebrow}>{item.status === 'RESOLVED' ? '✓ ĐÃ GIẢI QUYẾT' : '◷ CHỜ XỬ LÝ'}</Text>{staff && <Text style={ui.heading}>{referenceLabel(item.memberId)}</Text>}<Text style={ui.body}>{String(item.message || '')}</Text><Text style={ui.body}>{item.createdAt ? new Date(String(item.createdAt)).toLocaleString('vi-VN') : ''}</Text>{staff && <Button secondary disabled={busy} title={item.status === 'RESOLVED' ? 'Mở lại yêu cầu' : 'Đánh dấu đã giải quyết'} onPress={() => void save(item)} />}</View>} />;
}
